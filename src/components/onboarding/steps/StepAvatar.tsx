"use client";

import { motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import AvatarPicker from "@/components/ui/AvatarPicker";

interface StepAvatarProps {
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const fieldVariants = {
  hidden: { y: 8, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export function StepAvatar({ avatarUrl, onAvatarChange }: StepAvatarProps) {
  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
    >
      <Box component={motion.div} variants={fieldVariants}>
        <Typography
          variant="body2"
          sx={{ textAlign: "center", color: "text.secondary", mb: 0.5 }}
        >
          Pick a profile picture to personalize your account
        </Typography>
      </Box>

      <Box component={motion.div} variants={fieldVariants} sx={{ width: '100%', maxWidth: 320 }}>
        <AvatarPicker value={avatarUrl} onChange={onAvatarChange} />
      </Box>

      {avatarUrl && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
        >
          <Box
            component="img"
            src={avatarUrl}
            alt="Selected avatar"
            sx={{
              width: 80,
              height: 80,
              borderRadius: '16px',
              border: '3px solid var(--border-light)',
              bgcolor: 'background.paper',
              p: 0.75,
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Your selected avatar
          </Typography>
        </Box>
      )}
    </Box>
  );
}
