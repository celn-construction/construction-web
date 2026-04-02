"use client";

import { motion } from "framer-motion";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Box, Typography, FormHelperText } from "@mui/material";

interface OnboardingFieldProps {
  label: string;
  icon?: PhosphorIcon;
  children: React.ReactNode;
  error?: string;
}

const fieldVariants = {
  hidden: { y: 8, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export function OnboardingField({
  label,
  icon: Icon,
  children,
  error,
}: OnboardingFieldProps) {
  return (
    <Box component={motion.div} variants={fieldVariants} sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
        {label}
      </Typography>
      <Box sx={{ position: 'relative' }}>
        {Icon && (
          <Box
            sx={{
              pointerEvents: 'none',
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <Icon size={16} style={{ color: 'var(--text-muted)' }} />
          </Box>
        )}
        {children}
      </Box>
      {error && (
        <FormHelperText
          component={motion.p}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          error
          sx={{ fontSize: '0.75rem' }}
        >
          {error}
        </FormHelperText>
      )}
    </Box>
  );
}
