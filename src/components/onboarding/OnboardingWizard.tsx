"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { LogoIcon } from "~/components/ui/Logo";
import { Button } from "~/components/ui/button";
import { OnboardingProgress } from "./OnboardingProgress";
import { StepIdentity } from "./steps/StepIdentity";
import { StepContact } from "./steps/StepContact";
import { StepReview } from "./steps/StepReview";
import { api } from "~/trpc/react";

const steps = [
  { label: "Company", subtitle: "Tell us about your company" },
  { label: "Contact", subtitle: "How can we reach you?" },
  { label: "Review", subtitle: "Review and finalize" },
];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    companyType: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    licenseNumber: "",
  });

  const completeMutation = api.onboarding.createOrganization.useMutation({
    onSuccess: () => {
      Cookies.set("onboarding-complete", "true", { expires: 365 });
      setShowSuccess(true);
      toast.success("Welcome to BuildTrack Pro!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to complete onboarding");
    },
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = () => {
    if (currentStep === 0) {
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) {
        newErrors.name = "Company name is required";
      }
      if (!formData.companyType) {
        newErrors.companyType = "Company type is required";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    return true;
  };

  const goForward = () => {
    if (validateStep()) {
      setDirection(1);
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleSubmit = () => {
    completeMutation.mutate({
      name: formData.name,
      companyType: formData.companyType,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zip: formData.zip || undefined,
      licenseNumber: formData.licenseNumber || undefined,
    });
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        <div className="rounded-2xl border border-[var(--border-light)] bg-white p-8 shadow-lg shadow-black/[0.03] dark:bg-[var(--bg-card)] dark:shadow-black/20 sm:p-10 lg:p-12">
          {!showSuccess ? (
            <>
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.1,
                }}
                className="mb-8 flex justify-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-white dark:bg-gray-700 sm:h-18 sm:w-18">
                  <LogoIcon className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
              </motion.div>

              {/* Header */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08,
                    },
                  },
                }}
                className="mb-8 text-center"
              >
                <motion.h1
                  variants={{
                    hidden: { y: 12, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                  }}
                  className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
                >
                  Welcome to BuildTrack Pro
                </motion.h1>
                <motion.p
                  variants={{
                    hidden: { y: 12, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                  }}
                  className="text-sm text-[var(--text-secondary)] sm:text-base"
                >
                  {steps[currentStep]?.subtitle}
                </motion.p>
              </motion.div>

              {/* Progress */}
              <div className="mb-8">
                <OnboardingProgress
                  currentStep={currentStep}
                  totalSteps={steps.length}
                  labels={steps.map((s) => s.label)}
                />
              </div>

              {/* Steps */}
              <div className="mb-8">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "tween", duration: 0.3 },
                      opacity: { duration: 0.2 },
                    }}
                  >
                    {currentStep === 0 && (
                      <StepIdentity
                        formData={formData}
                        updateField={updateField}
                        errors={errors}
                      />
                    )}
                    {currentStep === 1 && (
                      <StepContact
                        formData={formData}
                        updateField={updateField}
                      />
                    )}
                    {currentStep === 2 && (
                      <StepReview
                        formData={formData}
                        updateField={updateField}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={goBack}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Back
                    </Button>
                  )}

                  <div className="flex-1" />

                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={goForward}
                      className="h-12 rounded-lg bg-[var(--accent-primary)] px-6 text-white hover:opacity-90"
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      loading={completeMutation.isPending}
                      className="group h-12 rounded-lg bg-[var(--accent-primary)] px-6 text-white hover:opacity-90"
                    >
                      Launch BuildTrack Pro
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  )}
                </div>

                {currentStep === 1 && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSkip}
                      className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Skip for now
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Success state
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.2,
                }}
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--status-green)]"
              >
                <Check className="h-10 w-10 text-white" />
              </motion.div>
              <motion.h2
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-2xl font-bold text-[var(--text-primary)]"
              >
                You&apos;re all set!
              </motion.h2>
              <motion.p
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[var(--text-secondary)]"
              >
                Taking you to your dashboard...
              </motion.p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
