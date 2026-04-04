import { test, expect } from "@playwright/test";
import { uniqueEmail, cleanupUser, cleanupVerifications } from "../fixtures/test-user";
import { getOtpForEmail } from "../fixtures/otp";
import { fillOtpInput } from "../helpers/otp-input";

const BETA_CODE = process.env.BETA_ACCESS_CODE ?? "buildtrack-beta-2026";

test.describe("Sign-up flow", () => {
  const emails: string[] = [];

  test.afterAll(async () => {
    for (const email of emails) {
      await cleanupUser(email);
      await cleanupVerifications(email);
    }
  });

  test("valid sign-up shows OTP verification step", async ({ page }) => {
    const email = uniqueEmail();
    emails.push(email);

    await page.goto("/sign-up");

    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill("TestPass123!");
    await page.getByLabel("Beta access code").fill(BETA_CODE);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Verify your email")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(email)).toBeVisible();
  });

  test("invalid beta code shows error", async ({ page }) => {
    await page.goto("/sign-up");

    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email address").fill(uniqueEmail());
    await page.getByLabel("Password").fill("TestPass123!");
    await page.getByLabel("Beta access code").fill("wrong-code");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
  });

  test("OTP verification redirects to onboarding", async ({ page }) => {
    const email = uniqueEmail();
    emails.push(email);

    await page.goto("/sign-up");

    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill("TestPass123!");
    await page.getByLabel("Beta access code").fill(BETA_CODE);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Verify your email")).toBeVisible({ timeout: 30000 });

    const otp = await getOtpForEmail(email);
    await fillOtpInput(page, otp);
    await page.getByRole("button", { name: "Verify email" }).click();

    await page.waitForURL("**/onboarding", { timeout: 15000 });
    await expect(page.getByText("Welcome to BuildTrack Pro")).toBeVisible();
  });

  test("sign-up link navigates to sign-in page", async ({ page }) => {
    await page.goto("/sign-up");

    await page.getByRole("link", { name: "Sign in" }).click();
    await page.waitForURL("**/sign-in");
  });
});
