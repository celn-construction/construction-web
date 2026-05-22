import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { Prisma } from "../../../../generated/prisma";
import { db } from "@/server/db";
import { auth } from "@/lib/auth";
import { analyzeDocument } from "@/server/services/tagging";
import { embedDocuments, toVectorSql } from "@/server/services/embeddings";
import { env } from "@/env";
import { documentProxyUrl } from "@/lib/blobProxy";
import { slotKindForFolder } from "@/lib/folders";
import { resolveSlotForUpload } from "@/server/api/helpers/uploadSlot";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/tiff",
  // PDFs
  "application/pdf",
  // Spreadsheets
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  // Word documents
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // CAD files
  "application/dxf",
  "application/dwg",
  "application/acad",
  "image/vnd.dwg",
  "image/vnd.dxf",
];

export async function POST(req: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const rawTaskId = formData.get("taskId") as string | null;
    const rawFolderId = formData.get("folderId") as string | null;
    const rawSlotId = formData.get("slotId") as string | null;
    // Empty string and missing both mean "unassigned"
    const taskId = rawTaskId && rawTaskId.length > 0 ? rawTaskId : null;
    const folderId = rawFolderId && rawFolderId.length > 0 ? rawFolderId : null;
    const slotIdFromForm = rawSlotId && rawSlotId.length > 0 ? rawSlotId : null;
    const title = (formData.get("title") as string | null)?.trim() || null;
    const notes = (formData.get("notes") as string | null)?.trim() ?? "";

    // Validate required fields. taskId/folderId are optional — null means unassigned.
    if (!file || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Verify project exists and user has access via organization membership
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check user is member of the project's organization
    const membership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: project.organizationId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Slot binding (Phase 3): if the upload targets a trackable folder, bind
    // it to a specific TaskRequirementSlot. Honors an explicit slotId from
    // the per-slot upload button; otherwise auto-links to the first empty
    // slot of the matching kind. Overflow uploads land unbound.
    const slotKind = slotKindForFolder(folderId);
    let slotId: string | null = null;
    if (taskId && slotKind) {
      const resolved = await resolveSlotForUpload(db, {
        taskId,
        slotKind,
        explicitSlotId: slotIdFromForm,
      });
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: 400 });
      }
      slotId = resolved.slotId;
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Unassigned uploads land in a project-level "_unassigned" path; assigned uploads use task/folder.
    const blobPath =
      taskId && folderId
        ? `projects/${projectId}/${taskId}/${folderId}/${file.name}`
        : `projects/${projectId}/_unassigned/${file.name}`;

    const blob = await put(blobPath, fileBuffer, {
      access: "private",
      addRandomSuffix: true,
      contentType: file.type,
    });

    const analysis = await analyzeDocument(fileBuffer, file.type, file.name);

    // Create document record with tags and description
    const createDocumentForSlot = (boundSlotId: string | null) =>
      db.document.create({
        data: {
          name: title || file.name,
          blobUrl: blob.url,
          mimeType: file.type,
          size: file.size,
          tags: analysis.tags,
          description: analysis.description,
          notes,
          taskId,
          folderId,
          slotId: boundSlotId,
          projectId,
          uploadedById: session.user.id,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    // The partial unique index on Document.slotId rejects a second binding
    // to the same slot. If we hit it, the explicit-pin case is a real
    // conflict (UI was stale), but the auto-link case is recoverable —
    // re-resolve once to grab the next empty slot.
    let document;
    try {
      document = await createDocumentForSlot(slotId);
    } catch (err) {
      const target =
        err instanceof Prisma.PrismaClientKnownRequestError ? err.meta?.target : undefined;
      const isSlotIdConflict =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        ((Array.isArray(target) && target.includes("slotId")) ||
          target === "Document_slotId_unique");

      if (!isSlotIdConflict) throw err;

      if (slotIdFromForm) {
        return NextResponse.json(
          { error: "Slot was filled by a concurrent upload — please retry" },
          { status: 409 },
        );
      }

      // Auto-link race: another upload won the slot we picked. Re-resolve
      // without an explicit slot and retry once. If every slot is now full,
      // resolveSlotForUpload returns slotId=null and the doc lands unbound.
      const retry = await resolveSlotForUpload(db, {
        taskId: taskId!,
        slotKind: slotKind!,
        explicitSlotId: null,
      });
      if (!retry.ok) {
        return NextResponse.json({ error: retry.error }, { status: 400 });
      }
      slotId = retry.slotId;
      document = await createDocumentForSlot(slotId);
    }

    // Generate and store embedding for semantic search (non-blocking — don't fail upload if this fails)
    // Embed filename + description + tags for richer semantic matching
    if (env.OPENAI_API_KEY && analysis.description) {
      try {
        const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[\s_\-]+/g, ' ');
        const lastDot = file.name.lastIndexOf('.');
        const ext = lastDot > 0 ? file.name.slice(lastDot + 1).toUpperCase() : '';
        const textToEmbed = [cleanName, analysis.description, `Tags: ${analysis.tags.join(', ')}`, `File type: ${ext}`].join('. ');
        const [embedding] = await embedDocuments([textToEmbed]);
        if (embedding) {
          const vectorSql = toVectorSql(embedding);
          await db.$executeRaw`UPDATE "Document" SET embedding = ${vectorSql}::vector WHERE id = ${document.id}`;
        }
      } catch (embeddingError) {
        console.error("Embedding generation failed:", embeddingError);
      }
    }

    return NextResponse.json({ ...document, blobUrl: documentProxyUrl(document.id) });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "An error occurred during upload" },
      { status: 500 }
    );
  }
}
