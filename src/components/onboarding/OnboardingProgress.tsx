"use client";

import { motion } from "framer-motion";
import { Check } from "@phosphor-icons/react";
import { Box, Typography, LinearProgress } from "@mui/material";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  labels,
}: OnboardingProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Box
      component={motion.div}
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {/* Step circles */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {labels.map((label, index) => {
          const isComplete = index < currentStep;
          const isActive = index === currentStep;

          return (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Box
                component={motion.div}
                sx={{
                  display: 'flex',
                  width: 28,
                  height: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  ...(isComplete && {
                    bgcolor: 'var(--accent-primary)',
                    color: 'var(--bg-primary)',
                  }),
                  ...(isActive && {
                    bgcolor: 'var(--accent-primary)',
                    color: 'var(--bg-primary)',
                  }),
                  ...(!isComplete && !isActive && {
                    border: '2px solid var(--border-color)',
                    color: 'var(--text-muted)',
                  }),
                }}
                animate={
                  isActive
                    ? {
                        scale: [1, 1.08, 1],
                        transition: {
                          duration: 0.6,
                          ease: "easeInOut",
                        },
                      }
                    : {}
                }
              >
                {isComplete ? (
                  <Box
                    component={motion.div}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 0,
                    }}
                  >
                    <Check size={18} weight="bold" />
                  </Box>
                ) : (
                  index + 1
                )}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  transition: 'color 0.2s',
                  ...(isActive
                    ? { color: 'text.primary', fontWeight: 500 }
                    : { color: 'text.secondary' }),
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Progress bar */}
      <Box sx={{ position: 'relative', height: 4, width: '100%', overflow: 'hidden', borderRadius: '6px', bgcolor: 'var(--bg-input)' }}>
        <Box
          component={motion.div}
          sx={{
            height: '100%',
            borderRadius: '6px',
            bgcolor: 'var(--accent-primary)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        />
      </Box>
    </Box>
  );
}
