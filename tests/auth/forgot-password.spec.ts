import { test, expect } from "@playwright/test";
import {
  createVerifiedUser,
  cleanupUser,
  cleanupVerifications,
} from "../fixtures/test-user";
import { getPasswordResetToken } from "../fixtures/otp";

test.describe("Forgot / Reset password flow", () => {
  const emails: string[] = [];

  test.afterAll(async () => {
    for (const email of emails) {
      await cleanupUser(email);
      await cleanupVerifications(email);
    }
  });

  test("submit forgot password shows success message", async ({ page }) => {
    const user = await createVerifiedUser();
    emails.push(user.email);

    await page.goto("/forgot-password");

    await page.getByLabel("Email address").fill(user.email);
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByText("Check your email")).toBeVisible({ timeout: 10000 });
  });

  test("non-existent email still shows success (no enumeration)", async ({ page }) => {
    await page.goto("/forgot-password");

    await page.getByLabel("Email address").fill("nonexistent@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByText("Check your email")).toBeVisible({ timeout: 10000 });
  });

  test("full reset flow: request → token → new password → sign in", async ({ page }) => {
    const user = await createVerifiedUser({ onboardingComplete: true });
    emails.push(user.email);
    const newPassword = "NewSecurePass456!";

    // Step 1: Request password reset
    await page.goto("/forgot-password");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByText("Check your email")).toBeVisible({ timeout: 10000 });

    // Step 2: Get reset token from DB
    const token = await getPasswordResetToken(user.id);

    // Step 3: Visit reset page with token
    await page.goto(`/reset-password?token=${token}`);

    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Reset password" }).click();

    // Should show success state
    await expect(page.getByText("Password reset!")).toBeVisible({ timeout: 10000 });

    // Click the button/link to go to sign-in
    await page.getByRole("button", { name: /continue to sign in/i }).click();
    await page.waitForURL("**/sign-in", { timeout: 15000 });

    // Step 4: Sign in with new password
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(newPassword);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should navigate away from sign-in (to onboarding or dashboard)
    await page.waitForURL(
      (url) => !url.pathname.includes("/sign-in"),
      { timeout: 15000 }
    );
  });
});
