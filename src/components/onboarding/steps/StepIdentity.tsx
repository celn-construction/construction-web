"use client";

import { motion } from "framer-motion";
import { Building2, Briefcase } from "lucide-react";
import { OnboardingField } from "../OnboardingField";
import { TextField, Select, MenuItem, FormControl, Box } from "@mui/material";

interface StepIdentityProps {
  formData: {
    name: string;
    companyType: string;
  };
  updateField: (field: string, value: string) => void;
  errors: Record<string, string>;
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

const companyTypes = [
  "General Contractor",
  "Subcontractor",
  "Developer",
  "Architecture Firm",
  "Engineering Firm",
  "Owner/Builder",
];

export function StepIdentity({
  formData,
  updateField,
  errors,
}: StepIdentityProps) {
  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <OnboardingField
        label="Company Name"
        icon={Building2}
        error={errors.name}
      >
        <TextField
          type="text"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Enter your company name"
          error={!!errors.name}
          fullWidth
          sx={{
            '& .MuiInputBase-root': {
              height: 48,
              paddingLeft: '40px',
            },
          }}
        />
      </OnboardingField>

      <OnboardingField
        label="Company Type"
        icon={Briefcase}
        error={errors.companyType}
      >
        <FormControl fullWidth error={!!errors.companyType}>
          <Select
            value={formData.companyType}
            onChange={(e) => updateField("companyType", e.target.value)}
            displayEmpty
            sx={{
              height: 48,
              paddingLeft: '40px',
            }}
          >
            <MenuItem value="" disabled>
              Select company type
            </MenuItem>
            {companyTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </OnboardingField>
    </Box>
  );
}
