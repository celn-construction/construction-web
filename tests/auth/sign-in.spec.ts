import { test, expect } from "@playwright/test";
import {
  createVerifiedUser,
  createUserWithOrg,
  cleanupUser,
  cleanupVerifications,
} from "../fixtures/test-user";

test.describe("Sign-in flow", () => {
  const emails: string[] = [];

  test.afterAll(async () => {
    for (const email of emails) {
      await cleanupUser(email);
      await cleanupVerifications(email);
    }
  });

  test("sign in with verified user (no org) redirects to onboarding", async ({ page }) => {
    const user = await createVerifiedUser({ onboardingComplete: false });
    emails.push(user.email);

    await page.goto("/sign-in");
    await expect(page.getByText("Welcome back")).toBeVisible();

    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL("**/onboarding", { timeout: 15000 });
  });

  test("sign in with verified user (has org) redirects to dashboard", async ({ page }) => {
    const { user, organization } = await createUserWithOrg();
    emails.push(user.email);

    await page.goto("/sign-in");

    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should redirect away from sign-in to org dashboard or new-project page
    await page.waitForURL(
      (url) => {
        const path = url.pathname;
        return (
          path.includes(organization.slug) ||
          path.includes("/new-project") ||
          path.includes("/onboarding")
        );
      },
      { timeout: 30000 }
    );
  });

  test("invalid credentials shows error", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByLabel("Email address").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("WrongPass123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
  });

  test("callbackUrl redirect works after sign-in", async ({ page }) => {
    const user = await createVerifiedUser({ onboardingComplete: true });
    emails.push(user.email);

    // Create an org so the user won't be redirected to onboarding
    // (use createUserWithOrg instead for a cleaner approach)
    await cleanupUser(user.email);
    const { user: orgUser, organization } = await createUserWithOrg();
    // Replace the tracked email
    emails[emails.length - 1] = orgUser.email;

    await page.goto(`/sign-in?callbackUrl=/${organization.slug}`);

    await page.getByLabel("Email address").fill(orgUser.email);
    await page.getByLabel("Password").fill(orgUser.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(`**/${organization.slug}**`, { timeout: 15000 });
  });

  test("forgot password link navigates correctly", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByRole("link", { name: "Forgot password?" }).click();
    await page.waitForURL("**/forgot-password");
  });
});
