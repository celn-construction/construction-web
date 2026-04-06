import type { Page } from "@playwright/test";

/**
 * Fills a MuiOtpInput component with a 6-digit OTP code.
 * The MuiOtpInput renders 6 individual <input type="tel"> elements.
 */
export async function fillOtpInput(page: Page, otp: string): Promise<void> {
  const inputs = page.locator('input[inputmode="numeric"]');
  const count = await inputs.count();

  for (let i = 0; i < Math.min(otp.length, count); i++) {
    await inputs.nth(i).fill(otp[i]!);
  }
}
