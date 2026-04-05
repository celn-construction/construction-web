import { test, expect } from "../fixtures";
import { createVerifiedUser, cleanupUser, cleanupVerifications } from "../fixtures/test-user";
import { getPasswordResetToken } from "../fixtures/otp";

test.describe("Forgot / Reset password flow", () => {
  test("submit forgot password shows success message", async ({
    verifiedUser,
    forgotPasswordPage,
  }) => {
    await forgotPasswordPage.goto();
    await forgotPasswordPage.requestReset(verifiedUser.email);
    await expect(forgotPasswordPage.successHeading).toBeVisible({ timeout: 10000 });
  });

  test("non-existent email still shows success (no enumeration)", async ({
    forgotPasswordPage,
  }) => {
    await forgotPasswordPage.goto();
    await forgotPasswordPage.requestReset("nonexistent@example.com");
    await expect(forgotPasswordPage.successHeading).toBeVisible({ timeout: 10000 });
  });

  test("full reset flow: request → token → new password → sign in", async ({
    page,
    forgotPasswordPage,
    resetPasswordPage,
    signInPage,
  }) => {
    const user = await createVerifiedUser({ onboardingComplete: true });
    const newPassword = "NewSecurePass456!";

    try {
      // Step 1: Request password reset
      await forgotPasswordPage.goto();
      await forgotPasswordPage.requestReset(user.email);
      await expect(forgotPasswordPage.successHeading).toBeVisible({ timeout: 10000 });

      // Step 2: Get reset token from DB
      const token = await getPasswordResetToken(user.id);

      // Step 3: Visit reset page with token and reset password
      await resetPasswordPage.goto(token);
      await resetPasswordPage.resetPassword(newPassword);
      await expect(resetPasswordPage.successHeading).toBeVisible({ timeout: 10000 });

      // Step 4: Navigate to sign-in
      await resetPasswordPage.continueToSignInButton.click();
      await page.waitForURL("**/sign-in", { timeout: 15000 });

      // Step 5: Sign in with new password
      await signInPage.signIn(user.email, newPassword);
      await page.waitForURL(
        (url) => !url.pathname.includes("/sign-in"),
        { timeout: 15000 }
      );
    } finally {
      await cleanupUser(user.email);
      await cleanupVerifications(user.email);
    }
  });
});
