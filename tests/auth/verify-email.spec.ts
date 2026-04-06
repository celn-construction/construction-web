import { test, expect, signInTestUser } from "../fixtures";

test.describe("Verify email page", () => {
  test("unverified user can send and verify OTP", async ({
    testUser,
    page,
    verifyEmailPage,
  }) => {
    await signInTestUser(page, testUser.email, testUser.password);
    await verifyEmailPage.goto();

    await verifyEmailPage.sendCodeIfNeeded();
    await expect(verifyEmailPage.otpInput).toBeVisible({ timeout: 15000 });

    await verifyEmailPage.verifyOtp(testUser.email);

    await page.waitForURL("**/onboarding", { timeout: 15000 });
  });

  test("already verified user is redirected away", async ({
    verifiedUser,
    page,
  }) => {
    await signInTestUser(page, verifiedUser.email, verifiedUser.password);
    await page.goto("/verify-email");

    await page.waitForURL("**/onboarding", { timeout: 15000 });
  });
});
