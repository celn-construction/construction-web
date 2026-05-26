'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Drop,
  type Icon,
} from '@phosphor-icons/react';
import { Box, Typography, Popover, ButtonBase } from '@mui/material';
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
  const [popoverOpen, setPopoverOpen] = useState(false);
  const chipRef = useRef<HTMLButtonElement | null>(null);

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

  const weatherInfo = weather ? getWeatherIcon(weather.icon) : null;
  const forecast = weather?.forecast ?? [];
  const hasForecast = forecast.length > 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
      {/* Weather chip — condition-tinted background, click to open forecast */}
      {weather && weatherInfo && (
        <ButtonBase
          ref={chipRef}
          onClick={hasForecast ? () => setPopoverOpen(true) : undefined}
          disabled={!hasForecast}
          aria-label={hasForecast ? 'Show 5-day forecast' : undefined}
          sx={{
            ...chipSx,
            bgcolor: getWeatherTint(weather.icon),
            opacity: 1,
            transition: 'opacity 0.3s ease, transform 0.15s ease',
            cursor: hasForecast ? 'pointer' : 'default',
            '&:hover': hasForecast ? { transform: 'translateY(-1px)' } : undefined,
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
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
              color: 'text.secondary',
            }}
          >
            {weatherInfo.label}
          </Typography>
        </ButtonBase>
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

      {/* 5-day forecast popover */}
      <Popover
        open={popoverOpen}
        anchorEl={chipRef.current}
        onClose={() => setPopoverOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 280,
              borderRadius: '10px',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography
            sx={{
              fontSize: '0.5625rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              lineHeight: 1,
            }}
          >
            5-day forecast
          </Typography>
        </Box>
        <Box sx={{ py: 0.5 }}>
          {forecast.map((day) => {
            const info = getWeatherIcon(day.icon);
            const showPrecip = day.precipPct >= 20;
            return (
              <Box
                key={day.date}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '36px 18px 1fr auto auto',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.75,
                  py: 0.875,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 550,
                    color: 'text.primary',
                    lineHeight: 1,
                  }}
                >
                  {day.label}
                </Typography>
                <info.Icon size={14} weight="regular" style={{ opacity: 0.65 }} />
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    lineHeight: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textTransform: 'capitalize',
                  }}
                >
                  {day.description || info.label}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.375,
                    minWidth: 32,
                    justifyContent: 'flex-end',
                    visibility: showPrecip ? 'visible' : 'hidden',
                  }}
                >
                  <Drop size={11} weight="fill" style={{ color: 'rgb(37, 99, 235)', opacity: 0.7 }} />
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      color: 'text.secondary',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                    }}
                  >
                    {day.precipPct}%
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'text.primary',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {day.hi}°
                  <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                    {' / '}
                    {day.lo}°
                  </Box>
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </Box>
  );
}
