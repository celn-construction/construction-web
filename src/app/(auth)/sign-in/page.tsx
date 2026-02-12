'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/ui/Logo';
import {
  Box,
  TextField,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Stack,
  Paper,
  CircularProgress,
} from '@mui/material';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const callbackUrl = inviteToken
    ? `/invite/${inviteToken}`
    : (searchParams.get('callbackUrl') || '/dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn.email({
        email,
        password,
        fetchOptions: {
          onSuccess: () => {
            router.push(callbackUrl);
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Sign in failed');
            setLoading(false);
          },
        },
      });
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          width: '100%',
          maxWidth: 1200,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Left side - Form */}
        <Box
          sx={{
            p: { xs: 6, lg: 8 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ mb: 6 }}>
            <Stack
              component={Link}
              href="/"
              direction="row"
              alignItems="center"
              gap={1.5}
              sx={{
                mb: 4,
                width: 'fit-content',
                textDecoration: 'none',
                '&:hover': { opacity: 0.8 },
                transition: 'opacity 0.2s',
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'warm.main',
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogoIcon size={28} />
              </Box>
              <Typography
                variant="h6"
                sx={{ color: 'text.primary', fontWeight: 500 }}
              >
                BuildTrack Pro
              </Typography>
            </Stack>
            <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 500, mb: 1.5 }}>
              Welcome back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to continue to your dashboard
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error && (
                <Alert severity="error" sx={{ borderRadius: 3 }}>
                  {error}
                </Alert>
              )}

              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', mb: 1 }}
                >
                  Email address
                </Typography>
                <TextField
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={20} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'input.background',
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', mb: 1 }}
                >
                  Password
                </Typography>
                <TextField
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={20} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'input.background',
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <FormControlLabel
                  control={<Checkbox size="small" />}
                  label={
                    <Typography variant="body2" color="text.secondary">
                      Remember me
                    </Typography>
                  }
                />
                <Typography
                  component={Link}
                  href="/forgot-password"
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Forgot password?
                </Typography>
              </Box>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-14 bg-[var(--accent-primary)] text-white text-base rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                Sign in
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Typography
                component={Link}
                href="/sign-up"
                variant="body2"
                sx={{
                  color: 'text.primary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Sign up
              </Typography>
            </Typography>
          </Box>
        </Box>

        {/* Right side - Image */}
        <Box
          sx={{
            position: 'relative',
            display: { xs: 'none', lg: 'block' },
          }}
        >
          <Image
            src="/images/auth-construction.jpg"
            alt="Construction site"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
              display: 'flex',
              alignItems: 'flex-end',
              p: 4,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ color: 'white', fontWeight: 500, mb: 1 }}
              >
                Manage Your Projects
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Track construction schedules, monitor progress, and collaborate with your team in real-time.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

function SignInLoading() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInForm />
    </Suspense>
  );
}
