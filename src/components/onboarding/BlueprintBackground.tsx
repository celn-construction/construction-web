"use client";

import { motion } from "framer-motion";
import { Box } from "@mui/material";

export function BlueprintBackground() {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.02 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      sx={{
        pointerEvents: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        backgroundImage: `
          linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px),
          radial-gradient(ellipse at 50% 40%, transparent 30%, var(--bg-primary) 70%)
        `,
        backgroundSize: "40px 40px, 40px 40px, 100% 100%",
        backgroundPosition: "0 0, 0 0, 0 0",
      }}
    />
  );
}
