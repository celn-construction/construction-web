"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { LogoIcon } from "~/components/ui/Logo";
import { OnboardingProgress } from "./OnboardingProgress";
import { api } from "~/trpc/react";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "~/lib/validations/onboarding";
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  FormHelperText,
  Paper,
  CircularProgress,
} from "@mui/material";
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

const companyTypes = [
  { value: "general_contractor", label: "General Contractor" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "developer", label: "Developer" },
  { value: "architect", label: "Architect" },
  { value: "engineer", label: "Engineer" },
  { value: "other", label: "Other" },
];

export function OnboardingWizardV2() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form with react-hook-form + zod
  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      companyType: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      licenseNumber: "",
    },
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

  const validateStep = async () => {
    if (currentStep === 0) {
      // Validate name and companyType fields for step 1
      const result = await trigger(["name", "companyType"]);
      return result;
    }
    return true;
  };

  const goForward = async () => {
    const isValid = await validateStep();
    if (isValid) {
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

  const onSubmit = (data: CreateOrganizationInput) => {
    completeMutation.mutate(data);
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
        p: { xs: 1.5, sm: 2 },
        overflow: 'auto',
      }}
    >
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        sx={{ width: '100%', maxWidth: 640, my: 'auto' }}
      >
        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            border: '1px solid var(--border-light)',
            p: { xs: 2.5, sm: 3, lg: 4 },
          }}
        >
          {!showSuccess ? (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
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
                sx={{ mb: 2.5, display: 'flex', justifyContent: 'center' }}
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
              <Box sx={{ mb: 2.5 }}>
                <OnboardingProgress
                  currentStep={currentStep}
                  totalSteps={steps.length}
                  labels={steps.map((s) => s.label)}
                />
              </Box>

              {/* Steps */}
              <Box sx={{ mb: 2.5 }}>
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
                    {/* Step 1: Company Information */}
                    {currentStep === 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Controller
                          name="name"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.name}>
                              <FormLabel>Company Name *</FormLabel>
                              <TextField
                                {...field}
                                placeholder="Acme Construction Inc."
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                fullWidth
                              />
                            </FormControl>
                          )}
                        />

                        <Controller
                          name="companyType"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.companyType}>
                              <FormLabel>Company Type *</FormLabel>
                              <Select
                                {...field}
                                displayEmpty
                                error={!!errors.companyType}
                              >
                                <MenuItem value="" disabled>
                                  Select company type
                                </MenuItem>
                                {companyTypes.map((type) => (
                                  <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.companyType && (
                                <FormHelperText error>
                                  {errors.companyType.message}
                                </FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />

                        <Controller
                          name="licenseNumber"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <FormLabel>License Number (Optional)</FormLabel>
                              <TextField
                                {...field}
                                placeholder="ABC-12345"
                                fullWidth
                              />
                            </FormControl>
                          )}
                        />
                      </Box>
                    )}

                    {/* Step 2: Contact Information */}
                    {currentStep === 1 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Controller
                          name="phone"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <FormLabel>Phone Number (Optional)</FormLabel>
                              <TextField
                                {...field}
                                type="tel"
                                placeholder="(555) 123-4567"
                                fullWidth
                              />
                            </FormControl>
                          )}
                        />

                        <Controller
                          name="website"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <FormLabel>Website (Optional)</FormLabel>
                              <TextField
                                {...field}
                                type="url"
                                placeholder="https://example.com"
                                fullWidth
                              />
                            </FormControl>
                          )}
                        />

                        <Controller
                          name="address"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <FormLabel>Address (Optional)</FormLabel>
                              <TextField
                                {...field}
                                placeholder="123 Main St"
                                fullWidth
                              />
                            </FormControl>
                          )}
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                          <Controller
                            name="city"
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <FormLabel>City (Optional)</FormLabel>
                                <TextField
                                  {...field}
                                  placeholder="New York"
                                  fullWidth
                                />
                              </FormControl>
                            )}
                          />

                          <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <FormLabel>State (Optional)</FormLabel>
                                <TextField
                                  {...field}
                                  placeholder="NY"
                                  fullWidth
                                />
                              </FormControl>
                            )}
                          />
                        </Box>

                        <Controller
                          name="zip"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <FormLabel>ZIP Code (Optional)</FormLabel>
                              <TextField
                                {...field}
                                placeholder="10001"
                                fullWidth
                              />
                            </FormControl>
                          )}
                        />
                      </Box>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 2 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3, borderRadius: 2, bgcolor: 'var(--bg-secondary)' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                          Review Your Information
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, fontSize: '0.875rem' }}>
                          <Box>
                            <Typography component="span" sx={{ color: 'text.disabled' }}>
                              Company Name:
                            </Typography>{" "}
                            <Typography component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>
                              {getValues("name") || "Not provided"}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography component="span" sx={{ color: 'text.disabled' }}>
                              Company Type:
                            </Typography>{" "}
                            <Typography component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>
                              {companyTypes.find(
                                (t) => t.value === getValues("companyType")
                              )?.label || "Not provided"}
                            </Typography>
                          </Box>
                          {getValues("phone") && (
                            <Box>
                              <Typography component="span" sx={{ color: 'text.disabled' }}>
                                Phone:
                              </Typography>{" "}
                              <Typography component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                {getValues("phone")}
                              </Typography>
                            </Box>
                          )}
                          {getValues("website") && (
                            <Box>
                              <Typography component="span" sx={{ color: 'text.disabled' }}>
                                Website:
                              </Typography>{" "}
                              <Typography component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                {getValues("website")}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
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
                      type="submit"
                      variant="contained"
                      onClick={completeMutation.isPending ? (e) => e.preventDefault() : undefined}
                      endIcon={
                        completeMutation.isPending ? (
                          <CircularProgress size={16} sx={{ color: 'primary.contrastText' }} />
                        ) : (
                          <ArrowRight size={16} />
                        )
                      }
                      sx={{
                        height: 48,
                        borderRadius: 2,
                        px: 3,
                        opacity: completeMutation.isPending ? 0.7 : 1,
                        cursor: completeMutation.isPending ? 'default' : 'pointer',
                        '& .MuiButton-endIcon': {
                          transition: 'transform 0.2s',
                        },
                        '&:hover .MuiButton-endIcon': {
                          transform: completeMutation.isPending ? 'none' : 'translateX(4px)',
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
            </Box>
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
