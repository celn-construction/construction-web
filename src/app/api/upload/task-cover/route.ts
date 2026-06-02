import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { db } from "@/server/db";
import { auth } from "@/lib/auth";
import { canManageProjects } from "@/lib/permissions";
import { taskCoverProxyUrl } from "@/lib/blobProxy";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Resolve the task + its project, verify the caller can manage the project,
 * and return the task's current cover URL (for cleanup on replace/remove).
 */
async function authorizeTaskCover(
  userId: string,
  projectId: string,
  taskId: string,
): Promise<
  | { ok: true; coverImageUrl: string | null }
  | { ok: false; status: number; error: string }
> {
  const task = await db.ganttTask.findFirst({
    where: { id: taskId, projectId },
    select: {
      coverImageUrl: true,
      project: { select: { organizationId: true } },
    },
  });

  if (!task) {
    return { ok: false, status: 404, error: "Task not found" };
  }

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: task.project.organizationId,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    return { ok: false, status: 403, error: "Access denied" };
  }

  if (!canManageProjects(membership.role)) {
    return {
      ok: false,
      status: 403,
      error: "You don't have permission to change the task cover",
    };
  }

  return { ok: true, coverImageUrl: task.coverImageUrl };
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
      return NextResponse.json(
        { error: "Only image files are allowed (JPEG, PNG, WebP, GIF)" },
        { status: 400 },
      );
    }

    const authResult = await authorizeTaskCover(session.user.id, projectId, taskId);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const blob = await put(
      `projects/${projectId}/_covers/${taskId}/${file.name}`,
      file,
      { access: "private", addRandomSuffix: true, contentType: file.type },
    );

    await db.ganttTask.update({
      where: { id: taskId },
      data: { coverImageUrl: blob.url },
    });

    // Best-effort cleanup of the previous cover blob to avoid orphans.
    if (authResult.coverImageUrl) {
      try {
        await del(authResult.coverImageUrl);
      } catch {
        // Old blob may already be gone — ignore.
      }
    }

    return NextResponse.json({ imageUrl: taskCoverProxyUrl(taskId) });
  } catch (error) {
    console.error("Task cover upload error:", error);
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

    const authResult = await authorizeTaskCover(session.user.id, projectId, taskId);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await db.ganttTask.update({
      where: { id: taskId },
      data: { coverImageUrl: null },
    });

    if (authResult.coverImageUrl) {
      try {
        await del(authResult.coverImageUrl);
      } catch {
        // Blob may already be gone — ignore.
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task cover delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
