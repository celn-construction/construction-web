import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { db } from "@/server/db";
import { auth } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

async function verifyOrgMembership(userId: string, organizationId: string) {
  return db.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    select: { role: true },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const organizationId = formData.get("organizationId") as string | null;

    if (!file || !organizationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const membership = await verifyOrgMembership(session.user.id, organizationId);
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const blob = await put(
      `projects/covers/${organizationId}/${file.name}`,
      file,
      { access: "public", addRandomSuffix: true }
    );

    return NextResponse.json({ imageUrl: blob.url });
  } catch (error) {
    console.error("Project image upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl, organizationId } = (await req.json()) as {
      imageUrl?: string;
      organizationId?: string;
    };

    if (!imageUrl || !organizationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const membership = await verifyOrgMembership(session.user.id, organizationId);
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify the URL belongs to this organization's blob path
    const expectedPrefix = `projects/covers/${organizationId}/`;
    if (!imageUrl.includes(expectedPrefix)) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 403 });
    }

    try {
      await del(imageUrl);
    } catch {
      // Blob may already be gone
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project image delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
