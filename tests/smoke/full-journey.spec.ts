import { test, expect } from "@playwright/test";
import { uniqueEmail, cleanupUser, cleanupVerifications } from "../fixtures/test-user";
import { getOtpForEmail } from "../fixtures/otp";
import { fillOtpInput } from "../helpers/otp-input";

const BETA_CODE = process.env.BETA_ACCESS_CODE ?? "buildtrack-beta-2026";

test.describe("Full journey: sign-up → verify → onboarding → dashboard", () => {
  const testEmail = uniqueEmail();
  const testPassword = "TestPass123!";
  const testName = "E2E Smoke Tester";
  const companyName = `Smoke Co ${Date.now()}`;

  test.afterAll(async () => {
    await cleanupUser(testEmail);
    await cleanupVerifications(testEmail);
  });

  test("complete sign-up through onboarding to dashboard", async ({ page }) => {
    // ─── Step 1: Sign Up ───
    await page.goto("/sign-up");
    await expect(page.getByText("Create your account")).toBeVisible();

    await page.getByLabel("Full name").fill(testName);
    await page.getByLabel("Email address").fill(testEmail);
    await page.getByLabel("Password").fill(testPassword);
    await page.getByLabel("Beta access code").fill(BETA_CODE);

    await page.getByRole("button", { name: "Create account" }).click();

    // ─── Step 2: OTP Verification ───
    await expect(page.getByText("Verify your email")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(testEmail)).toBeVisible();

    // Read OTP from the database
    const otp = await getOtpForEmail(testEmail);
    await fillOtpInput(page, otp);

    await page.getByRole("button", { name: "Verify email" }).click();

    // ─── Step 3: Onboarding Wizard ───
    await expect(page.getByText("Welcome to BuildTrack Pro")).toBeVisible({ timeout: 15000 });

    // Step 0: Company Identity (required fields)
    await page.getByPlaceholder("Enter your company name").fill(companyName);

    // Open the company type select and pick an option
    await page.getByText("Select company type").click();
    await page.getByRole("option", { name: "General Contractor" }).click();

    // Continue to Step 1 (Contact)
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("How can we reach you?")).toBeVisible();

    // Skip Step 1 (Contact)
    await page.getByRole("button", { name: "Skip for now" }).click();

    // Skip Step 2 (Logo)
    await expect(page.getByText("Add your company logo")).toBeVisible();
    await page.getByRole("button", { name: "Skip for now" }).click();

    // Step 3: Review
    await expect(page.getByText("Review and finalize")).toBeVisible();

    // Submit
    await page.getByRole("button", { name: "Launch BuildTrack Pro" }).click();

    // ─── Step 4: Success & Dashboard ───
    await expect(page.getByText("You're all set!")).toBeVisible({ timeout: 10000 });

    // Wait for redirect away from onboarding (1.5s delay in the app + navigation)
    await page.waitForURL(
      (url) => !url.pathname.includes("/onboarding"),
      { timeout: 15000 }
    );

    // Verify we landed on a real page (not auth pages)
    const url = page.url();
    expect(url).not.toContain("/sign-");
    expect(url).not.toContain("/verify-email");
  });
});
