import { Resend } from "resend";
import { env } from "@/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  // If no Resend API key, log to console (development mode)
  if (!resend) {
    console.log("========================================");
    console.log("PASSWORD RESET EMAIL (Development Mode)");
    console.log("========================================");
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("========================================");
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: "BuildTrack Pro <noreply@rentnotify.com>",
      to: email,
      subject: "Reset your password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f9; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 48px; height: 48px; background: #1f2937; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <div style="width: 32px; height: 32px; border: 2px solid white; border-radius: 50%;"></div>
              </div>
              <h2 style="color: #1f2937; margin: 16px 0 0 0; font-size: 18px; font-weight: 500;">BuildTrack Pro</h2>
            </div>

            <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">Reset your password</h1>

            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${resetUrl}" style="display: inline-block; background: #1f2937; color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-size: 16px; font-weight: 500;">
                Reset Password
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">
              This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #6b7280; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send password reset email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

export async function sendInvitationEmail(
  email: string,
  orgName: string,
  inviterName: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const inviteUrl = `${env.APP_URL}/invite/${token}`;
  const safeInviterName = escapeHtml(inviterName);
  const safeOrgName = escapeHtml(orgName);

  // If no Resend API key, surface error in production, log to console in development
  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "Email service not configured (missing RESEND_API_KEY)" };
    }
    console.log("========================================");
    console.log("INVITATION EMAIL (Development Mode)");
    console.log("========================================");
    console.log(`To: ${email}`);
    console.log(`Organization: ${orgName}`);
    console.log(`Invited by: ${inviterName}`);
    console.log(`Invite URL: ${inviteUrl}`);
    console.log("========================================");
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: "BuildTrack Pro <noreply@rentnotify.com>",
      to: email,
      subject: `${inviterName} invited you to join ${orgName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f9; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 48px; height: 48px; background: #1f2937; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <div style="width: 32px; height: 32px; border: 2px solid white; border-radius: 50%;"></div>
              </div>
              <h2 style="color: #1f2937; margin: 16px 0 0 0; font-size: 18px; font-weight: 500;">BuildTrack Pro</h2>
            </div>

            <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">You're invited!</h1>

            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
              <strong>${safeInviterName}</strong> has invited you to join <strong>${safeOrgName}</strong> on BuildTrack Pro.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${inviteUrl}" style="display: inline-block; background: #1f2937; color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-size: 16px; font-weight: 500;">
                Accept Invitation
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">
              This invitation will expire in 7 days. If you don't have a BuildTrack Pro account yet, you'll be able to create one.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${inviteUrl}" style="color: #6b7280; word-break: break-all;">${inviteUrl}</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send invitation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

