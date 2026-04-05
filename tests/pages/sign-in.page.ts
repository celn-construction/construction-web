import type { Page, Locator } from "@playwright/test";

export class SignInPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly heading: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email address");
    this.passwordInput = page.getByLabel("Password");
    this.signInButton = page.getByRole("button", { name: "Sign in" });
    this.heading = page.getByText("Welcome back");
    this.forgotPasswordLink = page.getByRole("link", { name: "Forgot password?" });
  }

  async goto(params?: string) {
    await this.page.goto(`/sign-in${params ? `?${params}` : ""}`);
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
