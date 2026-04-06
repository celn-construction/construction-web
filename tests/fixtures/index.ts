import { test as base } from "@playwright/test";
import {
  createTestUser,
  createVerifiedUser,
  createUserWithOrg,
  cleanupUser,
  cleanupVerifications,
  type TestUser,
  type TestUserWithOrg,
} from "./test-user";
import { signInTestUser } from "./auth";
import { SignUpPage } from "../pages/sign-up.page";
import { SignInPage } from "../pages/sign-in.page";
import { OnboardingPage } from "../pages/onboarding.page";
import { VerifyEmailPage } from "../pages/verify-email.page";
import { ForgotPasswordPage, ResetPasswordPage } from "../pages/forgot-password.page";
import { DocumentExplorerPage } from "../pages/document-explorer.page";

type TestFixtures = {
  // Data fixtures — auto-seed and auto-cleanup
  testUser: TestUser;
  verifiedUser: TestUser;
  userWithOrg: TestUserWithOrg;

  // Page Object Models — auto-instantiated
  signUpPage: SignUpPage;
  signInPage: SignInPage;
  onboardingPage: OnboardingPage;
  verifyEmailPage: VerifyEmailPage;
  forgotPasswordPage: ForgotPasswordPage;
  resetPasswordPage: ResetPasswordPage;
  documentExplorerPage: DocumentExplorerPage;
};

/**
 * Custom test object with auto-cleanup fixtures and Page Object Models.
 *
 * Usage:
 *   import { test, expect } from "../fixtures";
 *
 *   test("example", async ({ verifiedUser, signInPage }) => {
 *     await signInPage.goto();
 *     await signInPage.signIn(verifiedUser.email, verifiedUser.password);
 *   });
 */
export const test = base.extend<TestFixtures>({
  // ─── Data Fixtures ───

  testUser: async ({}, use) => {
    const user = await createTestUser();
    await use(user);
    await cleanupUser(user.email);
    await cleanupVerifications(user.email);
  },

  verifiedUser: async ({}, use) => {
    const user = await createVerifiedUser({ onboardingComplete: false });
    await use(user);
    await cleanupUser(user.email);
    await cleanupVerifications(user.email);
  },

  userWithOrg: async ({}, use) => {
    const result = await createUserWithOrg();
    await use(result);
    await cleanupUser(result.user.email);
    await cleanupVerifications(result.user.email);
  },

  // ─── Page Object Models ───

  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page));
  },

  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },

  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },

  verifyEmailPage: async ({ page }, use) => {
    await use(new VerifyEmailPage(page));
  },

  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
  },

  resetPasswordPage: async ({ page }, use) => {
    await use(new ResetPasswordPage(page));
  },

  documentExplorerPage: async ({ page }, use) => {
    await use(new DocumentExplorerPage(page));
  },
});

export { expect } from "@playwright/test";

// Re-export signInTestUser for tests that need API-based auth
export { signInTestUser } from "./auth";
