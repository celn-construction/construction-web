"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { LogoIcon } from "~/components/ui/Logo";
import { OnboardingProgress } from "./OnboardingProgress";
import { StepIdentity } from "./steps/StepIdentity";
import { StepContact } from "./steps/StepContact";
import { StepReview } from "./steps/StepReview";
import { api } from "~/trpc/react";
import { Box, Button, CircularProgress, Typography, Paper } from "@mui/material";
import { useSnackbar } from "@/hooks/useSnackbar";

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
  const { showSnackbar } = useSnackbar();
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
      showSnackbar("Welcome to BuildTrack Pro!", "success");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    },
    onError: (error: { message?: string }) => {
      showSnackbar(error.message || "Failed to complete onboarding", "error");
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
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        sx={{ width: '100%', maxWidth: 640 }}
      >
        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            border: '1px solid var(--border-light)',
            p: { xs: 4, sm: 5, lg: 6 },
          }}
        >
          {!showSuccess ? (
            <>
              {/* Logo */}
              <Box
                component={motion.div}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.1,
                }}
                sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    width: { xs: 64, sm: 72 },
                    height: { xs: 64, sm: 72 },
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    bgcolor: '#000',
                    color: 'white',
                  }}
                >
                  <LogoIcon sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, color: 'white' }} />
                </Box>
              </Box>

              {/* Header */}
              <Box
                component={motion.div}
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
                sx={{ mb: 4, textAlign: 'center' }}
              >
                <Typography
                  component={motion.h1}
                  variants={{
                    hidden: { y: 12, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                  }}
                  variant="h4"
                  sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}
                >
                  Welcome to BuildTrack Pro
                </Typography>
                <Typography
                  component={motion.p}
                  variants={{
                    hidden: { y: 12, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                  }}
                  variant="body1"
                  sx={{ color: 'text.secondary' }}
                >
                  {steps[currentStep]?.subtitle}
                </Typography>
              </Box>

              {/* Progress */}
              <Box sx={{ mb: 4 }}>
                <OnboardingProgress
                  currentStep={currentStep}
                  totalSteps={steps.length}
                  labels={steps.map((s) => s.label)}
                />
              </Box>

              {/* Steps */}
              <Box sx={{ mb: 4 }}>
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
              </Box>

              {/* Navigation */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                  {currentStep > 0 && (
                    <Button
                      variant="text"
                      onClick={goBack}
                      sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                    >
                      Back
                    </Button>
                  )}

                  <Box sx={{ flex: 1 }} />

                  {currentStep < steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={goForward}
                      sx={{ height: 48, borderRadius: 2, px: 3 }}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={completeMutation.isPending}
                      endIcon={
                        completeMutation.isPending ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <ArrowRight size={16} />
                        )
                      }
                      sx={{
                        height: 48,
                        borderRadius: 2,
                        px: 3,
                        '& .MuiButton-endIcon': {
                          transition: 'transform 0.2s',
                        },
                        '&:hover .MuiButton-endIcon': {
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      Launch BuildTrack Pro
                    </Button>
                  )}
                </Box>

                {currentStep === 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="text"
                      onClick={handleSkip}
                      sx={{ fontSize: '0.875rem', color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
                    >
                      Skip for now
                    </Button>
                  </Box>
                )}
              </Box>
            </>
          ) : (
            // Success state
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                textAlign: 'center',
              }}
            >
              <Box
                component={motion.div}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.2,
                }}
                sx={{
                  mb: 3,
                  display: 'flex',
                  width: 80,
                  height: 80,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: 'var(--status-green)',
                }}
              >
                <Check size={40} style={{ color: 'white' }} />
              </Box>
              <Typography
                component={motion.h2}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                variant="h5"
                sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}
              >
                You&apos;re all set!
              </Typography>
              <Typography
                component={motion.p}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                variant="body1"
                sx={{ color: 'text.secondary' }}
              >
                Taking you to your dashboard...
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
