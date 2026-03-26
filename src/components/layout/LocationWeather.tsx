'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  type Icon,
} from '@phosphor-icons/react';
import { Box, Typography } from '@mui/material';
import { api } from '@/trpc/react';

interface LocationWeatherProps {
  location: string;
  organizationId: string;
}

function getLocalTime(timezoneOffset: number): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const localDate = new Date(utcMs + timezoneOffset * 1000);
  return localDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Map OpenWeatherMap icon codes to Phosphor icons and labels */
function getWeatherIcon(icon: string): { Icon: Icon; label: string } {
  const code = icon.slice(0, 2);
  switch (code) {
    case '01': return icon.endsWith('n') ? { Icon: Moon, label: 'Clear' } : { Icon: Sun, label: 'Clear' };
    case '02': return { Icon: Cloud, label: 'Partly cloudy' };
    case '03': return { Icon: Cloud, label: 'Cloudy' };
    case '04': return { Icon: Cloud, label: 'Overcast' };
    case '09': return { Icon: CloudRain, label: 'Drizzle' };
    case '10': return { Icon: CloudRain, label: 'Rain' };
    case '11': return { Icon: CloudLightning, label: 'Thunderstorm' };
    case '13': return { Icon: CloudSnow, label: 'Snow' };
    case '50': return { Icon: CloudFog, label: 'Fog' };
    default:   return { Icon: Cloud, label: 'Cloudy' };
  }
}

export default function LocationWeather({ location, organizationId }: LocationWeatherProps) {
  const { data: weather } = api.weather.getByLocation.useQuery(
    { location, organizationId },
    { staleTime: 5 * 60 * 1000, enabled: !!location && !!organizationId }
  );

  const [localTime, setLocalTime] = useState<string | null>(null);

  useEffect(() => {
    if (weather?.timezoneOffset == null) {
      setLocalTime(null);
      return;
    }

    setLocalTime(getLocalTime(weather.timezoneOffset));

    const interval = setInterval(() => {
      setLocalTime(getLocalTime(weather.timezoneOffset));
    }, 60_000);

    return () => clearInterval(interval);
  }, [weather?.timezoneOffset]);

  const shortLocation = location.length > 30 ? location.slice(0, 28) + '…' : location;
  const weatherInfo = weather ? getWeatherIcon(weather.icon) : null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: 0.5,
        borderRadius: 'var(--radius-pill)',
        bgcolor: 'action.hover',
      }}
    >
      {/* Location */}
      <MapPin size={12} weight="bold" style={{ flexShrink: 0, opacity: 0.6 }} />
      <Typography
        sx={{
          fontSize: '0.625rem',
          fontWeight: 500,
          color: 'text.secondary',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {shortLocation}
      </Typography>

      {/* Weather */}
      {weather && weatherInfo && (
        <>
          <Typography sx={{ color: 'text.disabled', fontSize: '0.625rem', lineHeight: 1, userSelect: 'none' }}>·</Typography>
          <weatherInfo.Icon size={12} weight="bold" style={{ flexShrink: 0, opacity: 0.6 }} />
          <Typography
            sx={{
              fontSize: '0.625rem',
              fontWeight: 600,
              color: 'text.secondary',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {weatherInfo.label} {weather.temp}°F
          </Typography>
        </>
      )}

      {/* Local Time */}
      {localTime && (
        <>
          <Typography sx={{ color: 'text.disabled', fontSize: '0.625rem', lineHeight: 1, userSelect: 'none' }}>·</Typography>
          <Clock size={11} weight="bold" style={{ flexShrink: 0, opacity: 0.5 }} />
          <Typography
            sx={{
              fontSize: '0.625rem',
              fontWeight: 500,
              color: 'text.secondary',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {localTime}
          </Typography>
        </>
      )}
    </Box>
  );
}
