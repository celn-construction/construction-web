import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { hashPassword } from "better-auth/crypto";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "Password must be less than 128 characters" },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await db.verification.findFirst({
      where: {
        value: token,
        identifier: {
          startsWith: "password-reset:",
        },
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Extract user ID from identifier
    const userId = verification.identifier.replace("password-reset:", "");

    // Find the account to update password
    const account = await db.account.findFirst({
      where: {
        userId,
        providerId: "credential",
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the account password
    await db.account.update({
      where: { id: account.id },
      data: { password: hashedPassword },
    });

    // Delete the used verification token
    await db.verification.delete({
      where: { id: verification.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
