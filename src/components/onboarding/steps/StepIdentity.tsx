"use client";

import { motion } from "framer-motion";
import { Building2, Briefcase } from "lucide-react";
import { OnboardingField } from "../OnboardingField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <OnboardingField
        label="Company Name"
        icon={Building2}
        error={errors.name}
      >
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={cn(
            "h-12 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-gray-800",
            errors.name && "border-red-500"
          )}
          placeholder="Enter your company name"
        />
      </OnboardingField>

      <OnboardingField
        label="Company Type"
        icon={Briefcase}
        error={errors.companyType}
      >
        <Select
          value={formData.companyType}
          onValueChange={(value) => updateField("companyType", value)}
        >
          <SelectTrigger
            className={cn(
              "h-12 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] pl-10 pr-4 text-sm focus:ring-2 focus:ring-gray-800",
              errors.companyType && "border-red-500"
            )}
          >
            <SelectValue placeholder="Select company type" />
          </SelectTrigger>
          <SelectContent>
            {companyTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </OnboardingField>
    </motion.div>
  );
}
