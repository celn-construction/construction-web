import { testDb } from "./db";

/**
 * Reads the OTP code for a given email from the verification table.
 * Better Auth stores OTP codes with identifier `email-verification-otp-{email}`
 * and value format `{otp}:{attemptCount}`.
 *
 * Polls with retries since the OTP may not be written instantly after the sign-up request.
 */
export async function getOtpForEmail(
  email: string,
  { maxRetries = 10, delayMs = 500 } = {}
): Promise<string> {
  const identifier = `email-verification-otp-${email}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const record = await testDb.verification.findFirst({
      where: { identifier },
      orderBy: { createdAt: "desc" },
    });

    if (record?.value) {
      // Value format: "123456:0" (otp:attemptCount)
      const otp = record.value.split(":")[0];
      if (otp && otp.length === 6) {
        return otp;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(
    `OTP not found for ${email} after ${maxRetries} retries`
  );
}

/**
 * Reads a password reset token from the verification table.
 * Stored with identifier `password-reset:{userId}`.
 */
export async function getPasswordResetToken(
  userId: string,
  { maxRetries = 10, delayMs = 500 } = {}
): Promise<string> {
  const identifier = `password-reset:${userId}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const record = await testDb.verification.findFirst({
      where: { identifier },
      orderBy: { createdAt: "desc" },
    });

    if (record?.value) {
      return record.value;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(
    `Password reset token not found for user ${userId} after ${maxRetries} retries`
  );
}
