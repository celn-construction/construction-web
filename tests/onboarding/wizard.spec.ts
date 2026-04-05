import { test, expect, signInTestUser } from "../fixtures";

test.describe("Onboarding wizard", () => {
  test("Step 0 validation: cannot proceed without required fields", async ({
    verifiedUser,
    page,
    onboardingPage,
  }) => {
    await signInTestUser(page, verifiedUser.email, verifiedUser.password);
    await onboardingPage.goto();
    await expect(onboardingPage.heading).toBeVisible({ timeout: 15000 });

    // Try to continue without filling anything
    await onboardingPage.continueButton.click();

    await expect(page.getByText("Company name is required")).toBeVisible();
    await expect(page.getByText("Company type is required")).toBeVisible();

    // Fill only name, try again
    await onboardingPage.companyNameInput.fill("Test Company");
    await onboardingPage.continueButton.click();

    await expect(page.getByText("Company type is required")).toBeVisible();
  });

  test("forward/back navigation works", async ({
    verifiedUser,
    page,
    onboardingPage,
  }) => {
    await signInTestUser(page, verifiedUser.email, verifiedUser.password);
    await onboardingPage.goto();
    await expect(page.getByText("Tell us about your company")).toBeVisible({ timeout: 15000 });

    await onboardingPage.fillCompanyIdentity("Nav Test Co", "General Contractor");

    // Go to Step 1
    await onboardingPage.continueButton.click();
    await expect(page.getByText("How can we reach you?")).toBeVisible();

    // Go back to Step 0
    await onboardingPage.backButton.click();
    await expect(page.getByText("Tell us about your company")).toBeVisible();

    // Company name should be preserved
    await expect(onboardingPage.companyNameInput).toHaveValue("Nav Test Co");
  });

  test("skip buttons work on steps 1 and 2", async ({
    verifiedUser,
    page,
    onboardingPage,
  }) => {
    await signInTestUser(page, verifiedUser.email, verifiedUser.password);
    await onboardingPage.goto();
    await expect(onboardingPage.heading).toBeVisible({ timeout: 15000 });

    await onboardingPage.fillCompanyIdentity("Skip Test Co", "Subcontractor");
    await onboardingPage.continueButton.click();

    // Step 1: Skip
    await expect(page.getByText("How can we reach you?")).toBeVisible();
    await onboardingPage.skipButton.click();

    // Step 2: Skip
    await expect(page.getByText("Add your company logo")).toBeVisible();
    await onboardingPage.skipButton.click();

    // Should be on Step 3 (Review)
    await expect(page.getByText("Review and finalize")).toBeVisible();
  });

  test("complete onboarding creates org and redirects to dashboard", async ({
    verifiedUser,
    page,
    onboardingPage,
  }) => {
    const companyName = `Onboard Co ${Date.now()}`;

    await signInTestUser(page, verifiedUser.email, verifiedUser.password);
    await onboardingPage.goto();
    await expect(onboardingPage.heading).toBeVisible({ timeout: 15000 });

    await onboardingPage.completeOnboarding(companyName, "Developer");

    await expect(onboardingPage.successHeading).toBeVisible({ timeout: 10000 });
    await onboardingPage.waitForRedirect();
  });

  test("user with existing org is redirected away from onboarding", async ({
    userWithOrg,
    page,
    onboardingPage,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await onboardingPage.goto();

    await onboardingPage.waitForRedirect();
  });
});
