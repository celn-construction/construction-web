import { test, expect } from "../fixtures";
import { uniqueEmail, cleanupUser, cleanupVerifications } from "../fixtures/test-user";

test.describe("Sign-up flow", () => {
  const emails: string[] = [];

  test.afterAll(async () => {
    for (const email of emails) {
      await cleanupUser(email);
      await cleanupVerifications(email);
    }
  });

  test("valid sign-up shows OTP verification step", async ({ signUpPage }) => {
    const email = uniqueEmail();
    emails.push(email);

    await signUpPage.goto();
    await signUpPage.fillAndSubmit("Test User", email, "TestPass123!");

    await expect(signUpPage.verifyHeading).toBeVisible({ timeout: 30000 });
    await expect(signUpPage.page.getByText(email)).toBeVisible();
  });

  test("invalid beta code shows error", async ({ signUpPage }) => {
    await signUpPage.goto();
    await signUpPage.fillAndSubmit("Test User", uniqueEmail(), "TestPass123!", "wrong-code");

    await expect(signUpPage.page.getByRole("alert")).toBeVisible({ timeout: 10000 });
  });

  test("OTP verification redirects to onboarding", async ({ signUpPage, onboardingPage }) => {
    const email = uniqueEmail();
    emails.push(email);

    await signUpPage.goto();
    await signUpPage.fillAndSubmit("Test User", email, "TestPass123!");
    await expect(signUpPage.verifyHeading).toBeVisible({ timeout: 30000 });

    await signUpPage.verifyOtp(email);

    await signUpPage.page.waitForURL("**/onboarding", { timeout: 15000 });
    await expect(onboardingPage.heading).toBeVisible();
  });

  test("sign-up link navigates to sign-in page", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByRole("link", { name: "Sign in" }).click();
    await page.waitForURL("**/sign-in");
  });
});
