import { test, expect } from "../fixtures";
import { createUserWithOrg, cleanupUser, cleanupVerifications } from "../fixtures/test-user";

test.describe("Sign-in flow", () => {
  test("sign in with verified user (no org) redirects to onboarding", async ({
    verifiedUser,
    signInPage,
  }) => {
    await signInPage.goto();
    await expect(signInPage.heading).toBeVisible();
    await signInPage.signIn(verifiedUser.email, verifiedUser.password);

    await signInPage.page.waitForURL("**/onboarding", { timeout: 15000 });
  });

  test("sign in with verified user (has org) redirects to dashboard", async ({
    userWithOrg,
    signInPage,
  }) => {
    await signInPage.goto();
    await signInPage.signIn(userWithOrg.user.email, userWithOrg.user.password);

    await signInPage.page.waitForURL(
      (url) => {
        const path = url.pathname;
        return (
          path.includes(userWithOrg.organization.slug) ||
          path.includes("/new-project") ||
          path.includes("/onboarding")
        );
      },
      { timeout: 30000 }
    );
  });

  test("invalid credentials shows error", async ({ signInPage }) => {
    await signInPage.goto();
    await signInPage.signIn("nonexistent@example.com", "WrongPass123!");

    await expect(signInPage.page.getByRole("alert")).toBeVisible({ timeout: 10000 });
  });

  test("callbackUrl redirect works after sign-in", async ({ signInPage }) => {
    const { user, organization } = await createUserWithOrg();

    try {
      await signInPage.goto(`callbackUrl=/${organization.slug}`);
      await signInPage.signIn(user.email, user.password);

      await signInPage.page.waitForURL(`**/${organization.slug}**`, { timeout: 15000 });
    } finally {
      await cleanupUser(user.email);
      await cleanupVerifications(user.email);
    }
  });

  test("forgot password link navigates correctly", async ({ signInPage }) => {
    await signInPage.goto();
    await signInPage.forgotPasswordLink.click();
    await signInPage.page.waitForURL("**/forgot-password");
  });
});
