"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { LogoIcon } from "@/components/ui/Logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
        textAlign: "center",
        px: 2,
      }}
    >
      <LogoIcon size={40} sx={{ mb: 3, color: "text.primary" }} />

      <Typography
        variant="h4"
        sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}
      >
        Something went wrong
      </Typography>

      <Typography
        sx={{ color: "text.secondary", fontSize: "0.95rem", mb: 3 }}
      >
        An unexpected error occurred.
      </Typography>

      <Button
        onClick={reset}
        variant="contained"
        sx={{
          bgcolor: "text.primary",
          color: "background.default",
          textTransform: "none",
          fontWeight: 500,
          px: 3,
          py: 1,
          borderRadius: "8px",
          "&:hover": {
            bgcolor: "text.primary",
            opacity: 0.9,
          },
        }}
      >
        Try again
      </Button>
    </Box>
  );
}
