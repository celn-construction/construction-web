"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { LogoIcon } from "~/components/ui/Logo";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { OnboardingProgress } from "./OnboardingProgress";
import { api } from "~/trpc/react";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "~/lib/validations/onboarding";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form with react-hook-form + zod
  const form = useForm<CreateOrganizationInput>({
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
      toast.success("Welcome to BuildTrack Pro!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to complete onboarding");
    },
  });

  const validateStep = async () => {
    if (currentStep === 0) {
      // Validate name and companyType fields for step 1
      const result = await form.trigger(["name", "companyType"]);
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
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        <div className="rounded-2xl border border-[var(--border-light)] bg-white p-8 shadow-lg shadow-black/[0.03] dark:bg-[var(--bg-card)] dark:shadow-black/20 sm:p-10 lg:p-12">
          {!showSuccess ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      {/* Step 1: Company Information */}
                      {currentStep === 0 && (
                        <div className="space-y-5">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Acme Construction Inc."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="companyType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Type *</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select company type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {companyTypes.map((type) => (
                                      <SelectItem
                                        key={type.value}
                                        value={type.value}
                                      >
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="licenseNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>License Number (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="ABC-12345"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Step 2: Contact Information */}
                      {currentStep === 1 && (
                        <div className="space-y-5">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="tel"
                                    placeholder="(555) 123-4567"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="url"
                                    placeholder="https://example.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="123 Main St"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="New York" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="NY" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="zip"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ZIP Code (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="10001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Step 3: Review */}
                      {currentStep === 2 && (
                        <div className="space-y-4 rounded-lg bg-[var(--bg-secondary)] p-6">
                          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
                            Review Your Information
                          </h3>

                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-[var(--text-muted)]">
                                Company Name:
                              </span>{" "}
                              <span className="font-medium text-[var(--text-primary)]">
                                {form.getValues("name") || "Not provided"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--text-muted)]">
                                Company Type:
                              </span>{" "}
                              <span className="font-medium text-[var(--text-primary)]">
                                {companyTypes.find(
                                  (t) => t.value === form.getValues("companyType")
                                )?.label || "Not provided"}
                              </span>
                            </div>
                            {form.getValues("phone") && (
                              <div>
                                <span className="text-[var(--text-muted)]">
                                  Phone:
                                </span>{" "}
                                <span className="font-medium text-[var(--text-primary)]">
                                  {form.getValues("phone")}
                                </span>
                              </div>
                            )}
                            {form.getValues("website") && (
                              <div>
                                <span className="text-[var(--text-muted)]">
                                  Website:
                                </span>{" "}
                                <span className="font-medium text-[var(--text-primary)]">
                                  {form.getValues("website")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
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
                        type="submit"
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
              </form>
            </Form>
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
