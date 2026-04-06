import { test, expect, signInTestUser } from "../fixtures";
import {
  createUserWithOrg,
  cleanupUser,
  cleanupVerifications,
} from "../fixtures/test-user";

/**
 * Opens the Settings modal via the sidebar profile dropdown.
 * Clicks the user's name in the sidebar footer to open the profile dropdown,
 * then clicks "Account Settings" to open the settings modal.
 */
async function openSettingsModal(page: import("@playwright/test").Page, userName: string) {
  // Click the user profile area in sidebar to open dropdown
  await page.getByText(userName).first().click();
  // Click "Account Settings" in the dropdown
  await page.getByText("Account Settings").click();
}

test.describe("Create Team (Settings > Team tab)", () => {
  test("shows existing teams in Team tab", async ({
    userWithOrg,
    page,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);

    // Wait for sidebar to load
    await expect(page.getByText(userWithOrg.user.name)).toBeVisible({ timeout: 15000 });

    await openSettingsModal(page, userWithOrg.user.name);

    // Switch to Team tab
    await page.getByRole("button", { name: "Team" }).click();

    // Verify org is listed inside the settings dialog
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Your Teams")).toBeVisible();
    await expect(dialog.getByText(userWithOrg.organization.name)).toBeVisible();
    await expect(dialog.getByText("Owner")).toBeVisible();
  });

  test("Create New Team button navigates to onboarding", async ({
    userWithOrg,
    page,
    onboardingPage,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);

    await expect(page.getByText(userWithOrg.user.name)).toBeVisible({ timeout: 15000 });
    await openSettingsModal(page, userWithOrg.user.name);

    // Switch to Team tab
    await page.getByRole("button", { name: "Team" }).click();

    // Click Create New Team
    await page.getByText("Create New Team").click();

    // Should navigate to onboarding with ?new=true
    await page.waitForURL("**/onboarding?new=true", { timeout: 15000 });
    await expect(onboardingPage.heading).toBeVisible({ timeout: 15000 });
  });

  test("full flow: create new team via onboarding and switch to it", async ({
    page,
    onboardingPage,
  }) => {
    const result = await createUserWithOrg();
    const newTeamName = `New Team ${Date.now()}`;

    try {
      await signInTestUser(page, result.user.email, result.user.password);
      await page.goto(`/${result.organization.slug}`);

      // Wait for page to load
      await expect(page.getByText(result.user.name)).toBeVisible({ timeout: 15000 });

      // Open settings > Team tab > Create New Team
      await openSettingsModal(page, result.user.name);
      await page.getByRole("button", { name: "Team" }).click();
      await page.getByText("Create New Team").click();

      // Complete onboarding wizard for new team
      await page.waitForURL("**/onboarding?new=true", { timeout: 15000 });
      await expect(onboardingPage.heading).toBeVisible({ timeout: 15000 });
      await onboardingPage.completeOnboarding(newTeamName, "Subcontractor");

      // Should show success and redirect to new org
      await expect(onboardingPage.successHeading).toBeVisible({ timeout: 10000 });
      await onboardingPage.waitForRedirect();

      // Should be on the new org's page (not the old one)
      const url = page.url();
      expect(url).not.toContain(result.organization.slug);
      expect(url).not.toContain("/onboarding");
    } finally {
      await cleanupUser(result.user.email);
      await cleanupVerifications(result.user.email);
    }
  });
});
