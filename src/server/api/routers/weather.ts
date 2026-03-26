import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";
import { env } from "@/env";

interface GeoResult {
  lat: number;
  lon: number;
}

interface WeatherResult {
  main: { temp: number };
  weather: Array<{ icon: string; description: string }>;
  timezone: number;
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
        // Try full location first, then fall back to city-only (before first comma)
        // because OpenWeatherMap geo doesn't handle "City, ST" format well
        let geoData: GeoResult[] = [];
        for (const query of [input.location, input.location.split(",")[0]!.trim()]) {
          const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`;
          const geoRes = await fetch(geoUrl, { cache: 'no-store' });
          if (!geoRes.ok) continue;
          geoData = (await geoRes.json()) as GeoResult[];
          if (geoData.length) break;
        }
        if (!geoData.length) return null;

        const { lat, lon } = geoData[0]!;

        // Fetch current weather
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
        const weatherRes = await fetch(weatherUrl, { cache: 'no-store' });
        if (!weatherRes.ok) return null;

        const weatherData = (await weatherRes.json()) as WeatherResult;
        return {
          temp: Math.round(weatherData.main.temp),
          icon: weatherData.weather[0]?.icon ?? "01d",
          description: weatherData.weather[0]?.description ?? "",
          timezoneOffset: weatherData.timezone,
        };
      } catch {
        return null;
      }
    }),
});
