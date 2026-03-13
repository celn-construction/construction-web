'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Shield, Sparkles, LogIn } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { Box, Stack, Typography, Button, InputBase } from '@mui/material';

const C = {
  bg: '#F0F0F3',
  fg: '#1A1A2E',
  muted: '#8D99AE',
  card: '#FFFFFF',
  border: '#D9DBE1',
  primary: '#2B2D42',
} as const;

const monoFont = 'var(--font-jetbrains-mono)';
const bodyFont = 'var(--font-geist-sans)';

export default function Home() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleNotify() {
    if (email.trim()) setSubmitted(true);
  }

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: '56px', py: '16px', borderBottom: `1px solid ${C.border}` }}
      >
        <Typography sx={{ fontFamily: monoFont, fontWeight: 700, fontSize: 16, color: C.fg }}>
          BuildTrack Pro
        </Typography>
        <Stack direction="row" alignItems="center" gap={3}>
          <Typography sx={{ fontFamily: bodyFont, fontSize: 14, color: C.muted, cursor: 'pointer' }}>
            About
          </Typography>
          <Typography sx={{ fontFamily: bodyFont, fontSize: 14, color: C.muted, cursor: 'pointer' }}>
            Contact
          </Typography>
          {session ? (
            <Button
              component={Link}
              href="/dashboard"
              variant="outlined"
              sx={{
                fontFamily: bodyFont,
                fontSize: 14,
                color: C.fg,
                borderColor: C.border,
                textTransform: 'none',
                px: 2,
                py: 0.75,
                '&:hover': { borderColor: C.primary, bgcolor: 'transparent' },
              }}
            >
              Dashboard
            </Button>
          ) : (
            <Button
              component={Link}
              href="/sign-in"
              variant="outlined"
              startIcon={<LogIn size={14} />}
              sx={{
                fontFamily: bodyFont,
                fontSize: 14,
                color: C.fg,
                borderColor: C.border,
                textTransform: 'none',
                px: 2,
                py: 0.75,
                '&:hover': { borderColor: C.primary, bgcolor: 'transparent' },
              }}
            >
              Beta Login
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Hero Section */}
      <Stack
        alignItems="center"
        gap={5}
        sx={{ px: '56px', pt: '96px', pb: '80px' }}
      >
        {/* Badge */}
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{
            bgcolor: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: '4px',
            px: 2,
            py: 0.75,
          }}
        >
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.primary, flexShrink: 0 }} />
          <Typography sx={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 500, color: C.muted }}>
            Under Construction
          </Typography>
        </Stack>

        {/* Text block */}
        <Stack alignItems="center" gap={2.5}>
          <Typography
            sx={{
              fontFamily: monoFont,
              fontSize: 72,
              fontWeight: 700,
              color: C.fg,
              letterSpacing: '-3px',
              lineHeight: 0.95,
              textAlign: 'center',
            }}
          >
            Coming Soon
          </Typography>
          <Typography
            sx={{
              fontFamily: bodyFont,
              fontSize: 16,
              color: C.muted,
              lineHeight: 1.6,
              textAlign: 'center',
              maxWidth: 420,
            }}
          >
            We&apos;re building something worth the wait.
            <br />
            Sign up to get notified when we launch.
          </Typography>
        </Stack>

        {/* Email Signup */}
        {submitted ? (
          <Typography sx={{ fontFamily: bodyFont, fontSize: 14, color: C.primary, fontWeight: 500 }}>
            You&apos;re on the list! We&apos;ll be in touch.
          </Typography>
        ) : (
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 320,
                height: 40,
                bgcolor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: '4px',
                px: 2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <InputBase
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNotify()}
                sx={{ fontFamily: bodyFont, fontSize: 14, color: C.fg, width: '100%',
                  '::placeholder': { color: C.muted } }}
              />
            </Box>
            <Button
              onClick={handleNotify}
              sx={{
                fontFamily: bodyFont,
                fontSize: 14,
                fontWeight: 500,
                bgcolor: C.primary,
                color: '#FFFFFF',
                textTransform: 'none',
                px: 2.5,
                height: 40,
                borderRadius: '4px',
                '&:hover': { bgcolor: '#1a1d2e' },
              }}
            >
              Notify Me
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Divider */}
      <Stack alignItems="center" sx={{ px: '56px', py: 5 }}>
        <Box sx={{ width: 48, height: 1, bgcolor: C.border }} />
      </Stack>

      {/* Features Teaser */}
      <Stack
        direction="row"
        gap={3}
        sx={{ px: '56px' }}
      >
        {[
          {
            icon: <Zap size={20} color={C.primary} />,
            title: 'Lightning Fast',
            desc: 'Built for speed from the ground up. Every millisecond matters.',
          },
          {
            icon: <Shield size={20} color={C.primary} />,
            title: 'Rock Solid',
            desc: 'Enterprise-grade reliability you can count on every single day.',
          },
          {
            icon: <Sparkles size={20} color={C.primary} />,
            title: 'Beautifully Crafted',
            desc: 'Designed with obsessive attention to detail. Every pixel intentional.',
          },
        ].map((feat) => (
          <Stack
            key={feat.title}
            gap={1.5}
            sx={{
              flex: 1,
              bgcolor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              p: 3,
            }}
          >
            {feat.icon}
            <Typography sx={{ fontFamily: monoFont, fontSize: 14, fontWeight: 600, color: C.fg }}>
              {feat.title}
            </Typography>
            <Typography sx={{ fontFamily: bodyFont, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              {feat.desc}
            </Typography>
          </Stack>
        ))}
      </Stack>

      {/* Footer Border */}
      <Box sx={{ px: '56px', pt: 6 }}>
        <Box sx={{ height: 1, bgcolor: C.border, width: '100%' }} />
      </Box>

      {/* Footer */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: '56px', py: 2.5, mt: 'auto' }}
      >
        <Typography sx={{ fontFamily: monoFont, fontSize: 13, fontWeight: 600, color: C.muted }}>
          BuildTrack Pro
        </Typography>
        <Typography sx={{ fontFamily: bodyFont, fontSize: 13, color: C.muted }}>
          © 2026 All rights reserved.
        </Typography>
        <Stack direction="row" gap={2.5}>
          {['Twitter', 'LinkedIn', 'Email'].map((link) => (
            <Typography
              key={link}
              sx={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 500, color: C.muted, cursor: 'pointer' }}
            >
              {link}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
