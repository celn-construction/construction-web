"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface OnboardingFieldProps {
  label: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  error?: string;
}

const fieldVariants = {
  hidden: { y: 8, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export function OnboardingField({
  label,
  icon: Icon,
  children,
  error,
}: OnboardingFieldProps) {
  return (
    <motion.div variants={fieldVariants} className="space-y-1.5">
      <label className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
            <Icon className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
        )}
        {children}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
