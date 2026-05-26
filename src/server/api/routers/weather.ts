import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";
import { env } from "@/env";

interface GeoResult {
  lat: number;
  lon: number;
}

interface CurrentWeatherResult {
  main: { temp: number };
  weather: Array<{ icon: string; description: string }>;
  timezone: number;
}

interface ForecastEntry {
  dt: number; // unix seconds, UTC
  main: { temp: number; temp_min: number; temp_max: number };
  weather: Array<{ icon: string; description: string }>;
  pop: number; // probability of precipitation, 0..1
}

interface ForecastResult {
  list: ForecastEntry[];
  city: { timezone: number };
}

export interface ForecastDay {
  /** YYYY-MM-DD in city local time, stable React key */
  date: string;
  /** e.g. "Wed" — already in city local time */
  label: string;
  /** OpenWeatherMap icon code (e.g. "10d") */
  icon: string;
  /** Human description, e.g. "Light rain" */
  description: string;
  /** Rounded fahrenheit */
  hi: number;
  lo: number;
  /** 0..100, max across the day */
  precipPct: number;
}

/** Group 3-hour forecast entries into per-day summaries in the city's local timezone. */
function summarizeForecast(entries: ForecastEntry[], timezoneOffsetSec: number): ForecastDay[] {
  if (!entries.length) return [];

  const buckets = new Map<string, ForecastEntry[]>();
  for (const entry of entries) {
    // Shift UTC seconds into city-local seconds, then derive YYYY-MM-DD from the UTC view of that shifted timestamp.
    const localMs = (entry.dt + timezoneOffsetSec) * 1000;
    const localDate = new Date(localMs);
    const dateKey = `${localDate.getUTCFullYear()}-${String(localDate.getUTCMonth() + 1).padStart(2, "0")}-${String(localDate.getUTCDate()).padStart(2, "0")}`;
    const bucket = buckets.get(dateKey) ?? [];
    bucket.push(entry);
    buckets.set(dateKey, bucket);
  }

  const todayLocalMs = (Math.floor(Date.now() / 1000) + timezoneOffsetSec) * 1000;
  const todayLocal = new Date(todayLocalMs);
  const todayKey = `${todayLocal.getUTCFullYear()}-${String(todayLocal.getUTCMonth() + 1).padStart(2, "0")}-${String(todayLocal.getUTCDate()).padStart(2, "0")}`;

  const days: ForecastDay[] = [];
  for (const [dateKey, bucket] of buckets) {
    if (dateKey === todayKey) continue; // skip the partial "today" — current pill already shows today

    // Pick the entry closest to local noon for the day's representative icon/description.
    let representative = bucket[0]!;
    let bestNoonDelta = Number.POSITIVE_INFINITY;
    for (const entry of bucket) {
      const localHour = new Date((entry.dt + timezoneOffsetSec) * 1000).getUTCHours();
      const delta = Math.abs(localHour - 12);
      if (delta < bestNoonDelta) {
        bestNoonDelta = delta;
        representative = entry;
      }
    }

    let hi = -Infinity;
    let lo = Infinity;
    let maxPop = 0;
    for (const entry of bucket) {
      if (entry.main.temp_max > hi) hi = entry.main.temp_max;
      if (entry.main.temp_min < lo) lo = entry.main.temp_min;
      if (entry.pop > maxPop) maxPop = entry.pop;
    }

    // Use the UTC accessors on the shifted Date to render the city-local weekday.
    const labelDate = new Date((representative.dt + timezoneOffsetSec) * 1000);
    const label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][labelDate.getUTCDay()]!;

    days.push({
      date: dateKey,
      label,
      icon: representative.weather[0]?.icon ?? "01d",
      description: representative.weather[0]?.description ?? "",
      hi: Math.round(hi),
      lo: Math.round(lo),
      precipPct: Math.round(maxPop * 100),
    });

    if (days.length >= 5) break;
  }

  return days;
}

export const weatherRouter = createTRPCRouter({
  getByLocation: orgProcedure
    .input(z.object({ location: z.string().min(1) }))
    .query(async ({ input }) => {
      const apiKey = env.OPENWEATHERMAP_API_KEY;
      if (!apiKey) {
        return null;
      }

      try {
        // Geocode location string to lat/lng
        // Location may be "Street, City, State ZIP" — try progressively shorter segments
        // to find one OpenWeatherMap can resolve (street addresses usually fail)
        const parts = input.location.split(",").map((s) => s.trim());
        const candidates = [input.location];
        // Try "City, State" (skip street) — e.g. "Union City, NJ 07087"
        if (parts.length >= 3) candidates.push(parts.slice(1).join(", "));
        // Try just city name (second segment) — e.g. "Union City"
        if (parts.length >= 2) candidates.push(parts[1]!);
        // Try first segment as fallback — e.g. "New York Ave"
        candidates.push(parts[0]!);

        let geoData: GeoResult[] = [];
        for (const query of candidates) {
          const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`;
          const geoRes = await fetch(geoUrl, { cache: 'no-store' });
          if (!geoRes.ok) continue;
          geoData = (await geoRes.json()) as GeoResult[];
          if (geoData.length) break;
        }
        if (!geoData.length) return null;

        const { lat, lon } = geoData[0]!;

        // Fetch current weather and 5-day forecast in parallel (separate free-tier endpoints).
        const [currentRes, forecastRes] = await Promise.all([
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`,
            { cache: 'no-store' },
          ),
          fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`,
            { cache: 'no-store' },
          ),
        ]);

        if (!currentRes.ok) return null;
        const currentData = (await currentRes.json()) as CurrentWeatherResult;

        let forecast: ForecastDay[] = [];
        if (forecastRes.ok) {
          const forecastData = (await forecastRes.json()) as ForecastResult;
          forecast = summarizeForecast(forecastData.list, forecastData.city.timezone);
        }

        return {
          temp: Math.round(currentData.main.temp),
          icon: currentData.weather[0]?.icon ?? "01d",
          description: currentData.weather[0]?.description ?? "",
          timezoneOffset: currentData.timezone,
          forecast,
        };
      } catch {
        return null;
      }
    }),
});
