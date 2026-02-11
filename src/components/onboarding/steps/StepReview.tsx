"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { OnboardingField } from "../OnboardingField";
import { cn } from "~/lib/utils";

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <OnboardingField label="License Number (Optional)" icon={FileText}>
        <input
          type="text"
          value={formData.licenseNumber}
          onChange={(e) => updateField("licenseNumber", e.target.value)}
          className="h-12 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-warm)]"
          placeholder="Enter license number"
        />
      </OnboardingField>

      {summaryFields.length > 0 && (
        <motion.div variants={fieldVariants}>
          <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">
            Review Your Information
          </h3>
          <div className="space-y-0 overflow-hidden rounded-lg bg-[var(--bg-input)]">
            {summaryFields.map((field, index) => (
              <div
                key={field.label}
                className={cn(
                  "p-4",
                  index !== summaryFields.length - 1 &&
                    "border-b border-[var(--border-light)]"
                )}
              >
                <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {field.label}
                </dt>
                <dd className="text-sm text-[var(--text-primary)]">
                  {field.value}
                </dd>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
