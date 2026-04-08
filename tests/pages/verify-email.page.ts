import type { Page, Locator } from "@playwright/test";
import { getOtpForEmail } from "../fixtures/otp";
import { fillOtpInput } from "../helpers/otp-input";

export class VerifyEmailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly sendCodeButton: Locator;
  readonly verifyButton: Locator;
  readonly otpInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText("Verify your email");
    this.sendCodeButton = page.getByRole("button", { name: "Send verification code" });
    this.verifyButton = page.getByRole("button", { name: "Verify email" });
    this.otpInput = page.locator('input[inputmode="numeric"]').first();
  }

  async goto() {
    await this.page.goto("/verify-email");
  }

  async sendCodeIfNeeded() {
    try {
      await this.sendCodeButton.click({ timeout: 5000 });
    } catch {
      // OTP was already sent — inputs should be visible
    }
  }

  async verifyOtp(email: string) {
    const otp = await getOtpForEmail(email);
    await fillOtpInput(this.page, otp);
    await this.verifyButton.click();
  }
}
