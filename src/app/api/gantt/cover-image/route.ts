import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { db } from "@/server/db";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

async function verifyAccess(userId: string, projectId: string, taskId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) return null;

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: project.organizationId,
      },
    },
    select: { role: true },
  });

  if (!membership) return null;
  if (!hasPermission(membership.role, 'MANAGE_PROJECTS')) return null;

  const task = await db.ganttTask.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, coverImageUrl: true },
  });

  return task;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const taskId = formData.get("taskId") as string | null;

    if (!file || !projectId || !taskId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const task = await verifyAccess(session.user.id, projectId, taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    // Delete old cover image if one exists
    if (task.coverImageUrl) {
      try {
        await del(task.coverImageUrl);
      } catch {
        // Old blob may already be gone — continue
      }
    }

    const blob = await put(
      `projects/${projectId}/covers/${taskId}/${file.name}`,
      file,
      { access: "public", addRandomSuffix: true }
    );

    await db.ganttTask.update({
      where: { id: taskId },
      data: { coverImageUrl: blob.url },
    });

    return NextResponse.json({ coverImageUrl: blob.url });
  } catch (error) {
    console.error("Cover image upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId } = (await req.json()) as {
      projectId?: string;
      taskId?: string;
    };

    if (!projectId || !taskId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const task = await verifyAccess(session.user.id, projectId, taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    if (task.coverImageUrl) {
      try {
        await del(task.coverImageUrl);
      } catch {
        // Blob may already be gone
      }
    }

    await db.ganttTask.update({
      where: { id: taskId },
      data: { coverImageUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cover image delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
