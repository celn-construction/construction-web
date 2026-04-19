import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { serveBlob } from "../../_serveBlob";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { projectId } = await params;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { imageUrl: true, organizationId: true },
  });
  if (!project || !project.imageUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  const orgMembership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: project.organizationId,
      },
    },
    select: { id: true },
  });

  if (!orgMembership) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return serveBlob(req, { blobUrl: project.imageUrl, fallbackContentType: "image/jpeg" });
}
