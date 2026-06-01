import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { serveBlob } from "../../_serveBlob";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { taskId } = await params;

  const task = await db.ganttTask.findUnique({
    where: { id: taskId },
    select: {
      coverImageUrl: true,
      project: { select: { organizationId: true } },
    },
  });

  if (!task || !task.coverImageUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  const orgMembership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: task.project.organizationId,
      },
    },
    select: { id: true },
  });

  if (!orgMembership) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return serveBlob(req, { blobUrl: task.coverImageUrl, fallbackContentType: "image/jpeg" });
}
