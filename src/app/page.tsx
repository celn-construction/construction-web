'use client';

import Link from 'next/link';
import { ArrowRight, HardHat, Calendar, Users } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { LogoIcon } from '@/components/ui/Logo';
import { HeroImage } from '@/components/ui/optimized-image';
import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  Button,
  Paper,
} from '@mui/material';

export default function Home() {
  const { data: session } = useSession();

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        transition: 'background-color 0.15s',
      }}
    >
      {/* Navigation */}
      <Box component="nav" sx={{ py: 3 }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'warm.main',
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogoIcon size={22} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.primary',
                  fontWeight: 500,
                }}
              >
                BuildTrack Pro
              </Typography>
            </Stack>
            <Stack direction="row" gap={2}>
              {session ? (
                <Button
                  component={Link}
                  href="/dashboard"
                  variant="contained"
                  sx={{
                    bgcolor: 'warm.main',
                    color: 'white',
                    px: 3,
                    py: 1.25,
                    '&:hover': {
                      bgcolor: 'warm.dark',
                    },
                  }}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    component={Link}
                    href="/sign-in"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'text.primary',
                        bgcolor: 'transparent',
                      },
                    }}
                  >
                    Sign in
                  </Button>
                  <Button
                    component={Link}
                    href="/sign-up"
                    variant="contained"
                    sx={{
                      bgcolor: 'warm.main',
                      color: 'white',
                      px: 3,
                      py: 1.25,
                      '&:hover': {
                        bgcolor: 'warm.dark',
                      },
                    }}
                  >
                    Get started
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box component="section" sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            {/* Left Content */}
            <Grid item xs={12} lg={6}>
              <Stack spacing={4}>
                <Paper
                  elevation={1}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: 'background.paper',
                    px: 2,
                    py: 1,
                    width: 'fit-content',
                  }}
                >
                  <HardHat size={16} style={{ color: 'var(--text-secondary)' }} />
                  <Typography variant="body2" color="text.secondary">
                    Built for construction teams
                  </Typography>
                </Paper>

                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '3rem', lg: '3.75rem' },
                    fontWeight: 500,
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  Manage projects with{' '}
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    confidence
                  </Box>
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 400,
                    maxWidth: 550,
                  }}
                >
                  Track schedules, coordinate teams, and deliver projects on time.
                  The modern way to manage construction.
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                >
                  <Button
                    component={Link}
                    href="/sign-up"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowRight />}
                    sx={{
                      bgcolor: 'warm.main',
                      color: 'white',
                      px: 4,
                      py: 2,
                      '&:hover': {
                        bgcolor: 'warm.dark',
                        '& .MuiSvgIcon-root': {
                          transform: 'translateX(4px)',
                        },
                      },
                      '& .MuiSvgIcon-root': {
                        transition: 'transform 0.2s',
                      },
                    }}
                  >
                    Start free trial
                  </Button>
                  <Button
                    component={Link}
                    href="/sign-in"
                    variant="outlined"
                    size="large"
                    sx={{
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      px: 4,
                      py: 2,
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'divider',
                      },
                    }}
                  >
                    View demo
                  </Button>
                </Stack>

                {/* Stats */}
                <Stack direction="row" spacing={6} sx={{ pt: 4 }}>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                      }}
                    >
                      500+
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Projects managed
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                      }}
                    >
                      98%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      On-time delivery
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                      }}
                    >
                      24/7
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team support
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Grid>

            {/* Right Content - Hero Image */}
            <Grid item xs={12} lg={6}>
              <Box sx={{ position: 'relative' }}>
                <HeroImage
                  src="/images/hero-construction.jpg"
                  alt="Construction site aerial view showing workers and rebar foundation"
                  className="h-[500px] lg:h-[600px] shadow-sm"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  overlayOpacity={40}
                >
                  {/* Floating Cards */}
                  <Paper
                    elevation={6}
                    sx={{
                      position: 'absolute',
                      left: -32,
                      top: '25%',
                      p: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'action.hover',
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Calendar size={20} />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: 'text.primary' }}
                        >
                          Timeline
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          On schedule
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <Paper
                    elevation={6}
                    sx={{
                      position: 'absolute',
                      right: -16,
                      bottom: '25%',
                      p: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'action.hover',
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Users size={20} />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: 'text.primary' }}
                        >
                          12 Active
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Team members
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </HeroImage>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
