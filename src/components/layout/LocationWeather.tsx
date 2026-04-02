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

/** Map weather icon code to a subtle background tint */
function getWeatherTint(icon: string): string {
  const code = icon.slice(0, 2);
  switch (code) {
    case '01': return 'rgba(251, 191, 36, 0.08)';  // warm amber — clear
    case '02': return 'rgba(251, 191, 36, 0.05)';  // faint amber — partly cloudy
    case '03':
    case '04': return 'rgba(141, 153, 174, 0.1)';  // cool gray — cloudy/overcast
    case '09':
    case '10': return 'rgba(37, 99, 235, 0.06)';   // blue — rain
    case '11': return 'rgba(107, 114, 128, 0.1)';  // dark gray — thunderstorm
    case '13': return 'rgba(141, 153, 174, 0.08)';  // silver — snow
    case '50': return 'rgba(141, 153, 174, 0.06)';  // light gray — fog
    default:   return 'rgba(141, 153, 174, 0.08)';
  }
}

const chipSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.625,
  px: 1.25,
  py: 0.5,
  borderRadius: 'var(--radius-pill)',
  bgcolor: 'action.hover',
} as const;

const labelSx = {
  fontSize: '0.6875rem',
  fontWeight: 500,
  color: 'text.secondary',
  lineHeight: 1,
  whiteSpace: 'nowrap',
} as const;

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

  const shortLocation = location.length > 30 ? location.slice(0, 28) + '\u2026' : location;
  const weatherInfo = weather ? getWeatherIcon(weather.icon) : null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
      {/* Location chip */}
      <Box sx={chipSx}>
        <MapPin size={13} weight="bold" style={{ flexShrink: 0, opacity: 0.55 }} />
        <Typography sx={labelSx}>
          {shortLocation}
        </Typography>
      </Box>

      {/* Weather chip — condition-tinted background */}
      {weather && weatherInfo && (
        <Box
          sx={{
            ...chipSx,
            bgcolor: getWeatherTint(weather.icon),
            opacity: 1,
            transition: 'opacity 0.3s ease',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <weatherInfo.Icon size={13} weight="bold" style={{ flexShrink: 0, opacity: 0.65 }} />
          <Typography
            sx={{
              ...labelSx,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            {weather.temp}°F
          </Typography>
          <Typography
            sx={{
              ...labelSx,
              fontSize: '0.625rem',
              fontWeight: 400,
              color: 'text.disabled',
            }}
          >
            {weatherInfo.label}
          </Typography>
        </Box>
      )}

      {/* Time chip */}
      {localTime && (
        <Box
          sx={{
            ...chipSx,
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <Clock size={12} weight="bold" style={{ flexShrink: 0, opacity: 0.5 }} />
          <Typography
            sx={{
              ...labelSx,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {localTime}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
