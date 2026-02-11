"use client";

import { motion } from "framer-motion";
import { Phone, Globe, MapPin } from "lucide-react";
import { OnboardingField } from "../OnboardingField";
import { cn } from "~/lib/utils";

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <OnboardingField label="Phone Number" icon={Phone}>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          className="h-12 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-gray-800"
          placeholder="(555) 123-4567"
        />
      </OnboardingField>

      <OnboardingField label="Website" icon={Globe}>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => updateField("website", e.target.value)}
          className="h-12 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-gray-800"
          placeholder="https://example.com"
        />
      </OnboardingField>

      <OnboardingField label="Street Address" icon={MapPin}>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => updateField("address", e.target.value)}
          className="h-12 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-gray-800"
          placeholder="123 Main Street"
        />
      </OnboardingField>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <OnboardingField label="City">
          <input
            type="text"
            value={formData.city}
            onChange={(e) => updateField("city", e.target.value)}
            className="h-12 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="City"
          />
        </OnboardingField>

        <OnboardingField label="State">
          <input
            type="text"
            value={formData.state}
            onChange={(e) => updateField("state", e.target.value)}
            className="h-12 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="State"
          />
        </OnboardingField>

        <OnboardingField label="ZIP Code">
          <input
            type="text"
            value={formData.zip}
            onChange={(e) => updateField("zip", e.target.value)}
            className="h-12 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="ZIP"
          />
        </OnboardingField>
      </div>
    </motion.div>
  );
}
