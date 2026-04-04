import { test, expect } from "@playwright/test";
import {
  createTestUser,
  createVerifiedUser,
  cleanupUser,
  cleanupVerifications,
} from "../fixtures/test-user";
import { signInTestUser } from "../fixtures/auth";
import { getOtpForEmail } from "../fixtures/otp";
import { fillOtpInput } from "../helpers/otp-input";

test.describe("Verify email page", () => {
  const emails: string[] = [];

  test.afterAll(async () => {
    for (const email of emails) {
      await cleanupUser(email);
      await cleanupVerifications(email);
    }
  });

  test("unverified user can send and verify OTP", async ({ page }) => {
    const user = await createTestUser({ emailVerified: false });
    emails.push(user.email);

    // Sign in via API to get a real session cookie
    await signInTestUser(page, user.email, user.password);
    await page.goto("/verify-email");

    // Wait for either the "Send verification code" button or OTP inputs
    // (Better Auth may auto-send OTP during sign-in for unverified users)
    const sendButton = page.getByRole("button", { name: "Send verification code" });
    const otpInput = page.locator('input[inputmode="numeric"]').first();

    // Try to click send if it exists, otherwise OTP inputs are already shown
    try {
      await sendButton.click({ timeout: 5000 });
    } catch {
      // OTP was already sent — inputs should be visible
    }

    // Wait for OTP inputs
    await expect(otpInput).toBeVisible({ timeout: 15000 });

    // Read OTP and fill
    const otp = await getOtpForEmail(user.email);
    await fillOtpInput(page, otp);

    await page.getByRole("button", { name: "Verify email" }).click();

    // Should redirect to onboarding
    await page.waitForURL("**/onboarding", { timeout: 15000 });
  });

  test("already verified user is redirected away", async ({ page }) => {
    const user = await createVerifiedUser({ onboardingComplete: false });
    emails.push(user.email);

    // Sign in via API
    await signInTestUser(page, user.email, user.password);
    await page.goto("/verify-email");

    // Should auto-redirect to onboarding since email is already verified
    await page.waitForURL("**/onboarding", { timeout: 15000 });
  });
});
