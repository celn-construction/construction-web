import type { Page, Locator } from "@playwright/test";
import { getOtpForEmail } from "../fixtures/otp";
import { fillOtpInput } from "../helpers/otp-input";

const BETA_CODE = process.env.BETA_ACCESS_CODE ?? "buildtrack-beta-2026";

export class SignUpPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly betaCodeInput: Locator;
  readonly createAccountButton: Locator;
  readonly verifyEmailButton: Locator;
  readonly verifyHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel("Full name");
    this.emailInput = page.getByLabel("Email address");
    this.passwordInput = page.getByLabel("Password");
    this.betaCodeInput = page.getByLabel("Beta access code");
    this.createAccountButton = page.getByRole("button", { name: "Create account" });
    this.verifyEmailButton = page.getByRole("button", { name: "Verify email" });
    this.verifyHeading = page.getByText("Verify your email");
  }

  async goto() {
    await this.page.goto("/sign-up");
  }

  async fillForm(name: string, email: string, password: string, betaCode = BETA_CODE) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.betaCodeInput.fill(betaCode);
  }

  async submit() {
    await this.createAccountButton.click();
  }

  async fillAndSubmit(name: string, email: string, password: string, betaCode = BETA_CODE) {
    await this.fillForm(name, email, password, betaCode);
    await this.submit();
  }

  async verifyOtp(email: string) {
    const otp = await getOtpForEmail(email);
    await fillOtpInput(this.page, otp);
    await this.verifyEmailButton.click();
  }
}
