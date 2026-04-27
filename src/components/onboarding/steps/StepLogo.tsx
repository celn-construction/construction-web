"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, X, CloudArrowUp } from "@phosphor-icons/react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";

interface StepLogoProps {
  logoUrl: string;
  onLogoChange: (url: string) => void;
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

export function StepLogo({ logoUrl, onLogoChange }: StepLogoProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = useCallback(
    async (file: File) => {
      setError("");
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/organization/logo", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as { logoUrl?: string; error?: string };

        if (!res.ok) {
          setError(data.error || "Upload failed");
          return;
        }

        if (data.logoUrl) {
          onLogoChange(data.logoUrl);
        }
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [onLogoChange]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        void handleUpload(file);
      }
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: uploading,
  });

  const handleRemove = () => {
    onLogoChange("");
  };

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
          Add your company logo to personalize your workspace
        </Typography>
      </Box>

      <Box
        component={motion.div}
        variants={fieldVariants}
        sx={{ position: "relative" }}
      >
        {logoUrl ? (
          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                width: 140,
                height: 140,
                borderRadius: "20px",
                overflow: "hidden",
                border: "3px solid var(--border-light)",
              }}
            >
              <Box
                component="img"
                src={logoUrl}
                alt="Company logo"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
            <IconButton
              onClick={handleRemove}
              size="small"
              sx={{
                position: "absolute",
                top: -8,
                right: -8,
                bgcolor: "background.paper",
                border: "1px solid var(--border-light)",
                boxShadow: 1,
                width: 28,
                height: 28,
                "&:hover": { bgcolor: "error.light", color: "white" },
              }}
            >
              <X size={14} weight="bold" />
            </IconButton>
          </Box>
        ) : (
          <Box
            {...getRootProps()}
            sx={{
              width: 140,
              height: 140,
              borderRadius: "20px",
              border: "2px dashed",
              borderColor: isDragActive
                ? "primary.main"
                : "var(--border-color)",
              bgcolor: isDragActive
                ? "action.hover"
                : "var(--bg-input)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              cursor: uploading ? "default" : "pointer",
              transition: "all 0.2s",
              "&:hover": uploading
                ? {}
                : {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                  },
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <CircularProgress size={28} />
            ) : (
              <>
                <Camera
                  size={32}
                  weight="light"
                  style={{ color: "var(--text-muted)" }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontSize: "0.6875rem" }}
                >
                  Upload logo
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>

      {!logoUrl && !uploading && (
        <Box
          {...getRootProps()}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            cursor: "pointer",
            color: "text.secondary",
            "&:hover": { color: "text.primary" },
          }}
        >
          <CloudArrowUp size={16} weight="bold" />
          <Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
            or drag and drop an image here
          </Typography>
        </Box>
      )}

      {error && (
        <Typography
          component={motion.p}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          variant="caption"
          sx={{ color: "error.main" }}
        >
          {error}
        </Typography>
      )}

      <Typography
        component={motion.p}
        variants={fieldVariants}
        variant="caption"
        sx={{ color: "text.secondary", textAlign: "center" }}
      >
        JPG, PNG, GIF or WebP. Max 5MB.
      </Typography>
    </Box>
  );
}
