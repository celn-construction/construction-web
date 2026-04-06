import type { Page, Locator } from "@playwright/test";

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly sendResetButton: Locator;
  readonly successHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email address");
    this.sendResetButton = page.getByRole("button", { name: "Send reset link" });
    this.successHeading = page.getByText("Check your email");
  }

  async goto() {
    await this.page.goto("/forgot-password");
  }

  async requestReset(email: string) {
    await this.emailInput.fill(email);
    await this.sendResetButton.click();
  }
}

export class ResetPasswordPage {
  readonly page: Page;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly resetButton: Locator;
  readonly successHeading: Locator;
  readonly continueToSignInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newPasswordInput = page.getByLabel("New password", { exact: true });
    this.confirmPasswordInput = page.getByLabel("Confirm new password");
    this.resetButton = page.getByRole("button", { name: "Reset password" });
    this.successHeading = page.getByText("Password reset!");
    this.continueToSignInButton = page.getByRole("button", { name: /continue to sign in/i });
  }

  async goto(token: string) {
    await this.page.goto(`/reset-password?token=${token}`);
  }

  async resetPassword(newPassword: string) {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.resetButton.click();
  }
}
