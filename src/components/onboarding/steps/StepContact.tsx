"use client";

import { motion } from "framer-motion";
import { Phone, Globe, MapPin } from "@phosphor-icons/react";
import { OnboardingField } from "../OnboardingField";
import { TextField, Box } from "@mui/material";

interface StepContactProps {
  formData: {
    phone: string;
    website: string;
    address: string;
    city: string;
    state: string;
    zip: string;
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

export function StepContact({ formData, updateField }: StepContactProps) {
  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <OnboardingField label="Phone Number" icon={Phone}>
        <TextField
          type="tel"
          value={formData.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          placeholder="(555) 123-4567"
          fullWidth
          sx={{
            '& .MuiInputBase-root': {
              height: 48,
              paddingLeft: '40px',
            },
          }}
        />
      </OnboardingField>

      <OnboardingField label="Website" icon={Globe}>
        <TextField
          type="url"
          value={formData.website}
          onChange={(e) => updateField("website", e.target.value)}
          placeholder="https://example.com"
          fullWidth
          sx={{
            '& .MuiInputBase-root': {
              height: 48,
              paddingLeft: '40px',
            },
          }}
        />
      </OnboardingField>

      <OnboardingField label="Street Address" icon={MapPin}>
        <TextField
          type="text"
          value={formData.address}
          onChange={(e) => updateField("address", e.target.value)}
          placeholder="123 Main Street"
          fullWidth
          sx={{
            '& .MuiInputBase-root': {
              height: 48,
              paddingLeft: '40px',
            },
          }}
        />
      </OnboardingField>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
          gap: 3,
        }}
      >
        <OnboardingField label="City">
          <TextField
            type="text"
            value={formData.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="City"
            fullWidth
            sx={{
              '& .MuiInputBase-root': {
                height: 48,
              },
            }}
          />
        </OnboardingField>

        <OnboardingField label="State">
          <TextField
            type="text"
            value={formData.state}
            onChange={(e) => updateField("state", e.target.value)}
            placeholder="State"
            fullWidth
            sx={{
              '& .MuiInputBase-root': {
                height: 48,
              },
            }}
          />
        </OnboardingField>

        <OnboardingField label="ZIP Code">
          <TextField
            type="text"
            value={formData.zip}
            onChange={(e) => updateField("zip", e.target.value)}
            placeholder="ZIP"
            fullWidth
            sx={{
              '& .MuiInputBase-root': {
                height: 48,
              },
            }}
          />
        </OnboardingField>
      </Box>
    </Box>
  );
}
