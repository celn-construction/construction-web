import { test, expect } from "../fixtures";
import { uniqueEmail, cleanupUser, cleanupVerifications } from "../fixtures/test-user";

test.describe("Full journey: sign-up → verify → onboarding → dashboard", () => {
  const testEmail = uniqueEmail();
  const companyName = `Smoke Co ${Date.now()}`;

  test.afterAll(async () => {
    await cleanupUser(testEmail);
    await cleanupVerifications(testEmail);
  });

  test("complete sign-up through onboarding to dashboard", async ({
    signUpPage,
    onboardingPage,
  }) => {
    // ─── Step 1: Sign Up ───
    await signUpPage.goto();
    await expect(signUpPage.page.getByText("Create your account")).toBeVisible();
    await signUpPage.fillAndSubmit("E2E Smoke Tester", testEmail, "TestPass123!");

    // ─── Step 2: OTP Verification ───
    await expect(signUpPage.verifyHeading).toBeVisible({ timeout: 15000 });
    await expect(signUpPage.page.getByText(testEmail)).toBeVisible();
    await signUpPage.verifyOtp(testEmail);

    // ─── Step 3: Onboarding Wizard ───
    await expect(onboardingPage.heading).toBeVisible({ timeout: 15000 });
    await onboardingPage.completeOnboarding(companyName);

    // ─── Step 4: Success & Dashboard ───
    await expect(onboardingPage.successHeading).toBeVisible({ timeout: 10000 });
    await onboardingPage.waitForRedirect();

    const url = onboardingPage.page.url();
    expect(url).not.toContain("/sign-");
    expect(url).not.toContain("/verify-email");
  });
});
