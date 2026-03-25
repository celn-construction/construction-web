import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import { LogoIcon } from "@/components/ui/Logo";

export default function NotFound() {
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
        Page not found
      </Typography>

      <Typography
        sx={{ color: "text.secondary", fontSize: "0.95rem", mb: 3 }}
      >
        The page you are looking for doesn&apos;t exist or has been moved.
      </Typography>

      <Button
        component={Link}
        href="/"
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
        Go Home
      </Button>
    </Box>
  );
}
