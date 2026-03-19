'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authClient, signIn } from '@/lib/auth-client';
import OtpInput from '@/components/ui/OtpInput';
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
  Button,
} from '@mui/material';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const callbackUrl = inviteToken
    ? `/invite/${inviteToken}`
    : (searchParams.get('callbackUrl') || '/dashboard');

  const [step, setStep] = useState<'login' | 'verify-otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
          onError: async (ctx) => {
            const msg = ctx.error.message || '';
            if (msg.toLowerCase().includes('not verified')) {
              try {
                await authClient.emailOtp.sendVerificationOtp({
                  email,
                  type: 'email-verification',
                });
              } catch {
                // OTP may have been sent already via sendVerificationOnSignUp
              }
              setStep('verify-otp');
              setLoading(false);
            } else {
              setError(msg || 'Sign in failed');
              setLoading(false);
            }
          },
        },
      });
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });

      if (result.error) {
        setError(result.error.message || 'Verification failed');
      } else {
        // Re-attempt sign-in after verification
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
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'email-verification',
      });
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError('Failed to resend code');
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
                  color: 'white',
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
              {step === 'login' ? 'Welcome back' : 'Verify your email'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {step === 'login'
                ? 'Sign in to continue to your dashboard'
                : `We sent a 6-digit code to ${email}`}
            </Typography>
          </Box>

          {step === 'login' ? (
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
                    inputProps={{ 'aria-label': 'Email address' }}
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
                    inputProps={{ 'aria-label': 'Password' }}
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
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <ArrowRight size={20} />}
                  sx={{ height: 56, fontSize: '1rem', borderRadius: 1 }}
                >
                  Sign in
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleVerifyOtp}>
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
                    Verification code
                  </Typography>
                  <OtpInput value={otp} onChange={setOtp} autoFocus />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading || otp.length !== 6}
                  endIcon={loading ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <ArrowRight size={20} />}
                  sx={{ height: 56, fontSize: '1rem', borderRadius: 1 }}
                >
                  {loading ? 'Verifying...' : 'Verify & sign in'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    variant="text"
                    size="small"
                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Didn't get the code? Resend"}
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}

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
