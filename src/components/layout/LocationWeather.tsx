'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
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

  // Truncate location for display (e.g. "123 Main St, New York, NY 10001" -> "New York, NY")
  const shortLocation = location.length > 30 ? location.slice(0, 28) + '…' : location;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        ml: 0.75,
        px: 1,
        py: 0.5,
        borderRadius: 'var(--radius-pill)',
        bgcolor: 'action.hover',
      }}
    >
      {/* Location */}
      <MapPin size={11} style={{ flexShrink: 0, opacity: 0.6 }} />
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
      {weather && (
        <>
          <Typography sx={{ color: 'text.disabled', fontSize: '0.625rem', lineHeight: 1, userSelect: 'none' }}>·</Typography>
          <Image
            src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
            alt={weather.description}
            width={18}
            height={18}
            style={{ marginLeft: -2, marginRight: -2 }}
            unoptimized
          />
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
            {weather.temp}°F
          </Typography>
        </>
      )}

      {/* Local Time */}
      {localTime && (
        <>
          <Typography sx={{ color: 'text.disabled', fontSize: '0.625rem', lineHeight: 1, userSelect: 'none' }}>·</Typography>
          <Clock size={10} style={{ flexShrink: 0, opacity: 0.5 }} />
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
