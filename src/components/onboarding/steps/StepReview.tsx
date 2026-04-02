"use client";

import { motion } from "framer-motion";
import { FileText } from "@phosphor-icons/react";
import { OnboardingField } from "../OnboardingField";
import { TextField, Box, Typography, Paper } from "@mui/material";

interface StepReviewProps {
  formData: {
    name: string;
    companyType: string;
    phone: string;
    website: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    licenseNumber: string;
    logoUrl: string;
  };
  updateField: (field: string, value: string) => void;
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

export function StepReview({ formData, updateField }: StepReviewProps) {
  const summaryFields = [
    { label: "Company Name", value: formData.name },
    { label: "Company Type", value: formData.companyType },
    { label: "Phone", value: formData.phone },
    { label: "Website", value: formData.website },
    {
      label: "Address",
      value: formData.address
        ? `${formData.address}${formData.city ? `, ${formData.city}` : ""}${formData.state ? `, ${formData.state}` : ""}${formData.zip ? ` ${formData.zip}` : ""}`
        : "",
    },
  ].filter((field) => field.value);

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <OnboardingField label="License Number (Optional)" icon={FileText}>
        <TextField
          type="text"
          value={formData.licenseNumber}
          onChange={(e) => updateField("licenseNumber", e.target.value)}
          placeholder="Enter license number"
          fullWidth
          sx={{
            '& .MuiInputBase-root': {
              height: 48,
              paddingLeft: '40px',
            },
          }}
        />
      </OnboardingField>

      {formData.logoUrl && (
        <Box
          component={motion.div}
          variants={fieldVariants}
          sx={{ display: "flex", alignItems: "center", gap: 2 }}
        >
          <Box
            component="img"
            src={formData.logoUrl}
            alt="Company logo"
            sx={{
              width: 48,
              height: 48,
              borderRadius: "10px",
              objectFit: "cover",
              border: "1px solid var(--border-light)",
            }}
          />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Company logo uploaded
          </Typography>
        </Box>
      )}

      {summaryFields.length > 0 && (
        <Box component={motion.div} variants={fieldVariants}>
          <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500, color: 'text.primary' }}>
            Review Your Information
          </Typography>
          <Paper
            elevation={0}
            sx={{
              overflow: 'hidden',
              borderRadius: '12px',
              bgcolor: 'var(--bg-input)',
            }}
          >
            {summaryFields.map((field, index) => (
              <Box
                key={field.label}
                sx={{
                  p: 2,
                  ...(index !== summaryFields.length - 1 && {
                    borderBottom: '1px solid var(--border-light)',
                  }),
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mb: 0.5,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.disabled',
                  }}
                >
                  {field.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {field.value}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
