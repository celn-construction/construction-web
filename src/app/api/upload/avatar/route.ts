import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/server/db";
import { auth } from "@/lib/auth";
import { env } from "@/env";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 },
      );
    }

    const ext = EXT_BY_MIME[file.type] ?? "jpg";
    const pathname = `avatars/${session.user.id}-${Date.now()}.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      token: env.BLOB_AVATARS_READ_WRITE_TOKEN,
    });

    await db.user.update({
      where: { id: session.user.id },
      data: { image: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Avatar upload error:", error);
    const message = error instanceof Error ? error.message : "Avatar upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Avatar remove error:", error);
    const message = error instanceof Error ? error.message : "Avatar remove failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
