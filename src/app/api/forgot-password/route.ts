import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { env } from "@/env";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing password reset tokens for this user
    await db.verification.deleteMany({
      where: {
        identifier: `password-reset:${user.id}`,
      },
    });

    // Create new verification record
    await db.verification.create({
      data: {
        identifier: `password-reset:${user.id}`,
        value: token,
        expiresAt,
      },
    });

    // Send password reset email
    const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
    const emailResult = await sendPasswordResetEmail(user.email, resetUrl);

    if (!emailResult.success) {
      console.error("Failed to send email:", emailResult.error);
      // Still return success to not leak information
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
