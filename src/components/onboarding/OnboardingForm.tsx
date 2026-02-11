"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Phone, Globe, MapPin, FileText } from "lucide-react";
import { api } from "~/trpc/react";

const COMPANY_TYPES = [
  "General Contractor",
  "Subcontractor",
  "Developer",
  "Architecture Firm",
  "Engineering Firm",
  "Owner/Builder",
];

export default function OnboardingForm() {
  const router = useRouter();
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
  const [error, setError] = useState("");

  const createOrganization = api.onboarding.createOrganization.useMutation({
    onSuccess: () => {
      document.cookie = "onboarding-complete=true; path=/; max-age=31536000";
      router.push("/dashboard");
    },
    onError: (error) => {
      setError(error.message || "Failed to create organization");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.companyType) {
      setError("Company name and type are required");
      return;
    }

    createOrganization.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Company Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2"
        >
          Company Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Building2 className="w-5 h-5 text-gray-400 dark:text-[var(--text-muted)]" />
          </div>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="ABC Construction Co."
            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
            required
          />
        </div>
      </div>

      {/* Company Type */}
      <div>
        <label
          htmlFor="companyType"
          className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2"
        >
          Company Type <span className="text-red-500">*</span>
        </label>
        <select
          id="companyType"
          name="companyType"
          value={formData.companyType}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all"
          required
        >
          <option value="">Select company type</option>
          {COMPANY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2"
        >
          Phone Number
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Phone className="w-5 h-5 text-gray-400 dark:text-[var(--text-muted)]" />
          </div>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(555) 123-4567"
            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Website */}
      <div>
        <label
          htmlFor="website"
          className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2"
        >
          Website
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Globe className="w-5 h-5 text-gray-400 dark:text-[var(--text-muted)]" />
          </div>
          <input
            id="website"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://example.com"
            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2"
        >
          Address
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <MapPin className="w-5 h-5 text-gray-400 dark:text-[var(--text-muted)]" />
          </div>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main St"
            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* City, State, ZIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2"
          >
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            placeholder="San Francisco"
            className="w-full px-4 py-3 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2"
          >
            State
          </label>
          <input
            id="state"
            name="state"
            type="text"
            value={formData.state}
            onChange={handleChange}
            placeholder="CA"
            className="w-full px-4 py-3 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div>
          <label
            htmlFor="zip"
            className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2"
          >
            ZIP Code
          </label>
          <input
            id="zip"
            name="zip"
            type="text"
            value={formData.zip}
            onChange={handleChange}
            placeholder="94102"
            className="w-full px-4 py-3 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* License Number */}
      <div>
        <label
          htmlFor="licenseNumber"
          className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2"
        >
          License Number
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <FileText className="w-5 h-5 text-gray-400 dark:text-[var(--text-muted)]" />
          </div>
          <input
            id="licenseNumber"
            name="licenseNumber"
            type="text"
            value={formData.licenseNumber}
            onChange={handleChange}
            placeholder="CA-123456"
            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={createOrganization.isPending}
        className="w-full bg-[var(--accent-primary)] dark:bg-[var(--accent-purple)] text-white py-3 rounded-md hover:opacity-90 dark:hover:bg-[var(--accent-purple)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
      >
        {createOrganization.isPending ? "Creating..." : "Complete Setup"}
      </button>
    </form>
  );
}
