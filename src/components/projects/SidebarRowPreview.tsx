'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
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
import ProjectAvatar from '@/components/ui/ProjectAvatar';
import { api } from '@/trpc/react';

interface SidebarRowPreviewProps {
  name?: string;
  icon?: string;
  colorId?: string;
  imageUrl?: string;
  location?: string;
  organizationId?: string;
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

function getWeatherTint(icon: string): string {
  const code = icon.slice(0, 2);
  switch (code) {
    case '01': return 'rgba(251, 191, 36, 0.08)';
    case '02': return 'rgba(251, 191, 36, 0.05)';
    case '03':
    case '04': return 'rgba(141, 153, 174, 0.1)';
    case '09':
    case '10': return 'rgba(37, 99, 235, 0.06)';
    case '11': return 'rgba(107, 114, 128, 0.1)';
    case '13': return 'rgba(141, 153, 174, 0.08)';
    case '50': return 'rgba(141, 153, 174, 0.06)';
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

export default function SidebarRowPreview({
  name,
  icon,
  colorId,
  imageUrl,
  location,
  organizationId,
}: SidebarRowPreviewProps) {
  const theme = useTheme();
  const displayName = name?.trim() || 'Untitled project';

  // Debounce location before querying so we don't fire on every keystroke
  const [debouncedLocation, setDebouncedLocation] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(location?.trim() ?? ''), 800);
    return () => clearTimeout(t);
  }, [location]);

  const { data: weather } = api.weather.getByLocation.useQuery(
    { location: debouncedLocation, organizationId: organizationId ?? '' },
    {
      staleTime: 5 * 60 * 1000,
      enabled: debouncedLocation.length > 3 && !!organizationId,
    },
  );

  const [localTime, setLocalTime] = useState<string | null>(null);
  useEffect(() => {
    if (weather?.timezoneOffset == null) { setLocalTime(null); return; }
    setLocalTime(getLocalTime(weather.timezoneOffset));
    const interval = setInterval(() => setLocalTime(getLocalTime(weather.timezoneOffset)), 60_000);
    return () => clearInterval(interval);
  }, [weather?.timezoneOffset]);

  const weatherInfo = weather ? getWeatherIcon(weather.icon) : null;
  const shortLocation = debouncedLocation.length > 28
    ? debouncedLocation.slice(0, 26) + '…'
    : debouncedLocation;

  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography
        sx={{
          fontSize: '0.625rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          mb: 0.75,
        }}
      >
        Preview
      </Typography>

      {/* Mock sidebar frame */}
      <Box
        aria-hidden
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? 'sidebar.background' : 'background.default',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '10px',
          p: 0.75,
        }}
      >
        {/* Active project row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.25,
            py: 0.875,
            borderRadius: '8px',
            bgcolor: alpha(theme.palette.text.primary, 0.05),
            position: 'relative',
          }}
        >
          {/* Active accent bar */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '2.5px',
              height: 16,
              borderRadius: '0 2px 2px 0',
              bgcolor: 'sidebar.indicator',
            }}
          />
          <ProjectAvatar
            imageUrl={imageUrl ?? null}
            icon={icon}
            colorId={imageUrl ? null : colorId}
            size={22}
            borderRadius="6px"
          />
          <Typography
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 550,
              letterSpacing: '-0.005em',
              color: name?.trim() ? 'text.primary' : 'text.secondary',
              fontStyle: name?.trim() ? 'normal' : 'italic',
              lineHeight: 1,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </Typography>
        </Box>
      </Box>

      {/* Weather / time pills — appear once location is typed */}
      {!!debouncedLocation && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            flexWrap: 'wrap',
            mt: 1,
            '@keyframes fadeUp': {
              from: { opacity: 0, transform: 'translateY(4px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            animation: 'fadeUp 0.22s ease',
          }}
        >
          {/* Location chip */}
          <Box sx={chipSx}>
            <MapPin size={11} weight="bold" style={{ flexShrink: 0, opacity: 0.55 }} />
            <Typography sx={labelSx}>{shortLocation}</Typography>
          </Box>

          {/* Weather chip */}
          {weather && weatherInfo && (
            <Box
              sx={{
                ...chipSx,
                bgcolor: getWeatherTint(weather.icon),
                '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <weatherInfo.Icon size={11} weight="bold" style={{ flexShrink: 0, opacity: 0.65 }} />
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
                '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <Clock size={11} weight="bold" style={{ flexShrink: 0, opacity: 0.5 }} />
              <Typography sx={{ ...labelSx, fontVariantNumeric: 'tabular-nums' }}>
                {localTime}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
