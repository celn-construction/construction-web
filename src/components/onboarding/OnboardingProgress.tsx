"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  labels,
}: OnboardingProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <motion.div
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="w-full space-y-4"
    >
      {/* Step circles */}
      <div className="flex items-center justify-between">
        {labels.map((label, index) => {
          const isComplete = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <motion.div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  isComplete &&
                    "bg-[var(--accent-primary)] text-[var(--bg-primary)]",
                  isActive &&
                    "bg-[var(--accent-primary)] text-[var(--bg-primary)]",
                  !isComplete &&
                    !isActive &&
                    "border-2 border-[var(--border-color)] text-[var(--text-muted)]"
                )}
                animate={
                  isActive
                    ? {
                        scale: [1, 1.08, 1],
                        transition: {
                          duration: 0.6,
                          ease: "easeInOut",
                        },
                      }
                    : {}
                }
              >
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                ) : (
                  index + 1
                )}
              </motion.div>
              <span
                className={cn(
                  "text-xs transition-colors",
                  isActive
                    ? "text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-muted)]"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-[var(--bg-input)]">
        <motion.div
          className="h-full rounded-full bg-[var(--accent-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        />
      </div>
    </motion.div>
  );
}
