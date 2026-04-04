import { test, expect } from "@playwright/test";
import {
  createVerifiedUser,
  createUserWithOrg,
  cleanupUser,
  cleanupVerifications,
} from "../fixtures/test-user";
import { signInTestUser } from "../fixtures/auth";

test.describe("Onboarding wizard", () => {
  const emails: string[] = [];

  test.afterAll(async () => {
    for (const email of emails) {
      await cleanupUser(email);
      await cleanupVerifications(email);
    }
  });

  test("Step 0 validation: cannot proceed without required fields", async ({ page }) => {
    const user = await createVerifiedUser({ onboardingComplete: false });
    emails.push(user.email);

    await signInTestUser(page, user.email, user.password);
    await page.goto("/onboarding");

    await expect(page.getByText("Welcome to BuildTrack Pro")).toBeVisible({ timeout: 15000 });

    // Try to continue without filling anything
    await page.getByRole("button", { name: "Continue" }).click();

    // Should show validation errors
    await expect(page.getByText("Company name is required")).toBeVisible();
    await expect(page.getByText("Company type is required")).toBeVisible();

    // Fill only name, try again
    await page.getByPlaceholder("Enter your company name").fill("Test Company");
    await page.getByRole("button", { name: "Continue" }).click();

    // Company type still required
    await expect(page.getByText("Company type is required")).toBeVisible();
  });

  test("forward/back navigation works", async ({ page }) => {
    const user = await createVerifiedUser({ onboardingComplete: false });
    emails.push(user.email);

    await signInTestUser(page, user.email, user.password);
    await page.goto("/onboarding");

    await expect(page.getByText("Tell us about your company")).toBeVisible({ timeout: 15000 });

    // Fill required fields to proceed
    await page.getByPlaceholder("Enter your company name").fill("Nav Test Co");
    await page.getByText("Select company type").click();
    await page.getByRole("option", { name: "General Contractor" }).click();

    // Go to Step 1
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("How can we reach you?")).toBeVisible();

    // Go back to Step 0
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByText("Tell us about your company")).toBeVisible();

    // Company name should be preserved
    await expect(page.getByPlaceholder("Enter your company name")).toHaveValue("Nav Test Co");
  });

  test("skip buttons work on steps 1 and 2", async ({ page }) => {
    const user = await createVerifiedUser({ onboardingComplete: false });
    emails.push(user.email);

    await signInTestUser(page, user.email, user.password);
    await page.goto("/onboarding");

    await expect(page.getByText("Welcome to BuildTrack Pro")).toBeVisible({ timeout: 15000 });

    // Fill Step 0
    await page.getByPlaceholder("Enter your company name").fill("Skip Test Co");
    await page.getByText("Select company type").click();
    await page.getByRole("option", { name: "Subcontractor" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 1: Skip
    await expect(page.getByText("How can we reach you?")).toBeVisible();
    await page.getByRole("button", { name: "Skip for now" }).click();

    // Step 2: Skip
    await expect(page.getByText("Add your company logo")).toBeVisible();
    await page.getByRole("button", { name: "Skip for now" }).click();

    // Should be on Step 3 (Review)
    await expect(page.getByText("Review and finalize")).toBeVisible();
  });

  test("complete onboarding creates org and redirects to dashboard", async ({ page }) => {
    const user = await createVerifiedUser({ onboardingComplete: false });
    emails.push(user.email);
    const companyName = `Onboard Co ${Date.now()}`;

    await signInTestUser(page, user.email, user.password);
    await page.goto("/onboarding");

    await expect(page.getByText("Welcome to BuildTrack Pro")).toBeVisible({ timeout: 15000 });

    // Step 0: Company Identity
    await page.getByPlaceholder("Enter your company name").fill(companyName);
    await page.getByText("Select company type").click();
    await page.getByRole("option", { name: "Developer" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 1: Skip
    await page.getByRole("button", { name: "Skip for now" }).click();

    // Step 2: Skip
    await page.getByRole("button", { name: "Skip for now" }).click();

    // Step 3: Review - submit
    await expect(page.getByText("Review and finalize")).toBeVisible();
    await page.getByRole("button", { name: "Launch BuildTrack Pro" }).click();

    // Success state
    await expect(page.getByText("You're all set!")).toBeVisible({ timeout: 10000 });

    // Wait for redirect away from onboarding (1.5s delay in app + navigation)
    await page.waitForURL(
      (url) => !url.pathname.includes("/onboarding"),
      { timeout: 15000 }
    );
  });

  test("user with existing org is redirected away from onboarding", async ({ page }) => {
    const { user, organization } = await createUserWithOrg();
    emails.push(user.email);

    await signInTestUser(page, user.email, user.password);
    await page.goto("/onboarding");

    // Should redirect to org dashboard (server-side check in onboarding page)
    await page.waitForURL(
      (url) => !url.pathname.includes("/onboarding"),
      { timeout: 15000 }
    );
  });
});
