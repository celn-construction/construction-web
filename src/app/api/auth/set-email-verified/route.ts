import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.emailVerified) {
    return NextResponse.json(
      { success: false, error: "Email not verified" },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("email-verified", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return response;
}
