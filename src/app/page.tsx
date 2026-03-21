'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { Box, Stack, Typography, Button, InputBase } from '@mui/material';

const monoFont = 'var(--font-jetbrains-mono)';
const bodyFont = 'var(--font-geist-sans)';

function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import('three');
      const mount = mountRef.current;
      if (!mount) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        60,
        mount.clientWidth / mount.clientHeight,
        0.1,
        100
      );
      camera.position.z = 6;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      // Theme-derived colors: accent-primary #2B2D42, text-secondary #737373, text-muted #a3a3a3, border #e5e5e5
      const colors = [0x2b2d42, 0x737373, 0xa3a3a3, 0xe5e5e5];
      const beamDefs = Array.from({ length: 14 }, (_, i) => ({
        color: colors[i % colors.length]!,
        y: -3.5 + i * 0.55,
        radius: 0.015 + (i % 3) * 0.005,
        opacity: 0.08 + (i % 4) * 0.03,
      }));

      const beams: InstanceType<typeof THREE.Mesh>[] = [];

      // Smooth sine-wave curves spanning the full viewport width
      beamDefs.forEach(({ color, y, radius, opacity }) => {
        const points: InstanceType<typeof THREE.Vector3>[] = [];
        const segments = 80;
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const x = -10 + t * 20;           // span -10 to +10
          const wave = Math.sin(t * Math.PI * 2) * 0.8; // one full sine period
          points.push(new THREE.Vector3(x, y + wave, 0));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(curve, 200, radius, 8, false);
        const mat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        beams.push(mesh);
      });

      const onResize = () => {
        if (!mount) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      };
      window.addEventListener('resize', onResize);

      let animId: number;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = Date.now() * 0.00015;
        beams.forEach((beam, i) => {
          // Gentle uniform vertical drift
          beam.position.y = Math.sin(t + i * 0.8) * 0.15;
          beam.rotation.z = Math.sin(t * 0.7 + i * 0.6) * 0.03;
        });
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
      };
    })();

    return () => cleanup?.();
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'joined' | 'already'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Something went wrong');
        setStatus('idle');
        return;
      }

      const data = await res.json() as { ok: boolean; alreadySignedUp?: boolean };
      setStatus(data.alreadySignedUp ? 'already' : 'joined');
    } catch {
      setError('Something went wrong');
      setStatus('idle');
    }
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        bgcolor: 'var(--lp-bg)',
        overflow: 'hidden',
      }}
    >
      {/* Three.js animated background */}
      <ThreeBackground />

      {/* Floating pill navbar */}
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
          px: 3,
          py: 1.25,
          bgcolor: 'var(--lp-glass)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderRadius: '9999px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.09)',
          border: '1px solid var(--lp-glass-border)',
          minWidth: 280,
        }}
      >
        <Typography
          sx={{
            fontFamily: monoFont,
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--lp-fg)',
            letterSpacing: '-0.3px',
          }}
        >
          BuildTrack Pro
        </Typography>

        {session ? (
          <Button
            component={Link}
            href="/api/resolve-redirect?redirect=true"
            sx={{
              fontFamily: bodyFont,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--lp-fg)',
              bgcolor: 'var(--lp-nav-btn)',
              textTransform: 'none',
              px: 2,
              py: 0.5,
              borderRadius: '9999px',
              minHeight: 'unset',
              '&:hover': { bgcolor: 'var(--lp-nav-btn-hover)' },
            }}
          >
            Dashboard
          </Button>
        ) : (
          <Button
            component={Link}
            href="/sign-in"
            startIcon={<LogIn size={13} />}
            sx={{
              fontFamily: bodyFont,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--lp-fg)',
              bgcolor: 'var(--lp-nav-btn)',
              textTransform: 'none',
              px: 2,
              py: 0.5,
              borderRadius: '9999px',
              minHeight: 'unset',
              '&:hover': { bgcolor: 'var(--lp-nav-btn-hover)' },
            }}
          >
            Beta Login
          </Button>
        )}
      </Box>

      {/* Main content — centered */}
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ position: 'relative', zIndex: 10, minHeight: '100vh', px: 2 }}
      >
        {/* Soft radial glow behind card */}
        <Box
          sx={{
            position: 'absolute',
            width: 560,
            height: 560,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(43,45,66,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Frosted glass card */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            bgcolor: 'var(--lp-glass-card)',
            border: '1px solid var(--lp-glass-card-border)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.18)',
            px: { xs: 4, sm: 5 },
            py: 5.5,
            width: '100%',
            maxWidth: 440,
          }}
        >
          {/* Subtle inner gradient */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(248,250,252,0.65) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />

          <Stack alignItems="center" gap={3} sx={{ position: 'relative', zIndex: 1 }}>
            {/* Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'var(--lp-badge-bg)',
                border: '1px solid var(--lp-badge-border)',
                borderRadius: '9999px',
                px: 1.75,
                py: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'var(--lp-dot)',
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 500, color: 'var(--lp-subtle)' }}
              >
                Early Access
              </Typography>
            </Box>

            {/* Heading + subtitle */}
            <Stack alignItems="center" gap={1.5}>
              <Typography
                sx={{
                  fontFamily: monoFont,
                  fontSize: { xs: 28, sm: 34 },
                  fontWeight: 700,
                  color: 'var(--lp-fg)',
                  letterSpacing: '-1.5px',
                  lineHeight: 1.05,
                  textAlign: 'center',
                }}
              >
                Join the waitlist
              </Typography>
              <Typography
                sx={{
                  fontFamily: bodyFont,
                  fontSize: 14,
                  color: 'var(--lp-muted)',
                  lineHeight: 1.65,
                  textAlign: 'center',
                  maxWidth: 340,
                }}
              >
                BuildTrack Pro brings Gantt scheduling, document control, and team
                coordination to your job sites. Be first in line for early access.
              </Typography>
            </Stack>

            {/* Form or success state */}
            {status === 'joined' || status === 'already' ? (
              <Stack alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: status === 'already'
                      ? 'rgba(59, 130, 246, 0.12)'
                      : 'rgba(34, 197, 94, 0.12)',
                    border: `1px solid ${status === 'already'
                      ? 'rgba(59, 130, 246, 0.3)'
                      : 'rgba(34, 197, 94, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={status === 'already' ? 'var(--status-blue)' : 'var(--status-green)'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </Box>
                <Typography
                  sx={{
                    fontFamily: monoFont,
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--lp-fg)',
                  }}
                >
                  {status === 'already'
                    ? 'You\u2019re already on the list!'
                    : 'You\u2019re on the list!'}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: bodyFont,
                    fontSize: 13,
                    color: 'var(--lp-muted)',
                    textAlign: 'center',
                  }}
                >
                  {status === 'already'
                    ? 'This email is already signed up. We\u2019ll be in touch when early access is ready.'
                    : 'Check your inbox for a confirmation. We\u2019ll reach out before we launch.'}
                </Typography>
              </Stack>
            ) : (
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ width: '100%' }}
              >
                <Stack direction="row" gap={1.5}>
                  <Box
                    sx={{
                      flex: 1,
                      height: 44,
                      bgcolor: 'var(--lp-input-bg)',
                      border: '1px solid var(--lp-input-border)',
                      borderRadius: '10px',
                      px: 2,
                      display: 'flex',
                      alignItems: 'center',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <InputBase
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      sx={{
                        fontFamily: bodyFont,
                        fontSize: 14,
                        color: 'var(--lp-fg)',
                        width: '100%',
                        '& input::placeholder': { color: 'var(--lp-placeholder)' },
                      }}
                    />
                  </Box>
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    sx={{
                      fontFamily: bodyFont,
                      fontSize: 13,
                      fontWeight: 600,
                      bgcolor: 'var(--lp-cta)',
                      color: '#ffffff',
                      textTransform: 'none',
                      px: 2.5,
                      height: 44,
                      borderRadius: '10px',
                      flexShrink: 0,
                      '&:hover': { bgcolor: 'var(--lp-cta-hover)' },
                      '&:disabled': { opacity: 0.6 },
                    }}
                  >
                    {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
                  </Button>
                </Stack>
                {error && (
                  <Typography
                    sx={{
                      fontFamily: bodyFont,
                      fontSize: 12,
                      color: 'var(--status-red)',
                      mt: 1,
                      textAlign: 'center',
                    }}
                  >
                    {error}
                  </Typography>
                )}
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
