import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { hasImplicitProjectAccess } from "@/lib/permissions";
import { serveBlob } from "../_serveBlob";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { documentId } = await params;

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: {
      blobUrl: true,
      mimeType: true,
      name: true,
      projectId: true,
      project: { select: { organizationId: true } },
    },
  });
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  const projectMember = await db.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: session.user.id,
        projectId: doc.projectId,
      },
    },
    select: { id: true },
  });

  if (!projectMember) {
    const orgMembership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: doc.project.organizationId,
        },
      },
      select: { role: true },
    });

    if (!orgMembership || !hasImplicitProjectAccess(orgMembership.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return serveBlob(req, {
    blobUrl: doc.blobUrl,
    fallbackContentType: doc.mimeType,
    filename: doc.name,
  });
}
