import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { sendWaitlistConfirmationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  try {
    const existing = await db.waitlistEntry.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ ok: true, alreadySignedUp: true });
    }

    await db.waitlistEntry.create({ data: { email } });

    // Send confirmation email (non-blocking — don't fail the request if email fails)
    void sendWaitlistConfirmationEmail(email);

    return NextResponse.json({ ok: true, alreadySignedUp: false });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
