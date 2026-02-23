import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/server/db";
import { auth } from "@/lib/auth";
import { analyzeDocument } from "@/server/services/tagging";
import { embedDocuments, toVectorSql } from "@/server/services/embeddings";
import { env } from "@/env";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
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
    const taskId = formData.get("taskId") as string | null;
    const folderId = formData.get("folderId") as string | null;

    // Validate required fields
    if (!file || !projectId || !taskId || !folderId) {
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

    // Upload to Vercel Blob
    const blob = await put(
      `projects/${projectId}/${taskId}/${folderId}/${file.name}`,
      file,
      {
        access: "public",
        addRandomSuffix: true,
      }
    );

    // Analyze file for tags and description
    const analysis = await analyzeDocument(blob.url, file.type, file.name);

    // Create document record with tags and description
    const document = await db.document.create({
      data: {
        name: file.name,
        blobUrl: blob.url,
        mimeType: file.type,
        size: file.size,
        tags: analysis.tags,
        description: analysis.description,
        taskId,
        folderId,
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

    // Generate and store embedding for semantic search (non-blocking — don't fail upload if this fails)
    if (env.VOYAGE_API_KEY && analysis.description) {
      try {
        const [embedding] = await embedDocuments([analysis.description]);
        if (embedding) {
          const vectorSql = toVectorSql(embedding);
          await db.$executeRaw`UPDATE "Document" SET embedding = ${vectorSql}::vector WHERE id = ${document.id}`;
        }
      } catch (embeddingError) {
        console.error("Embedding generation failed:", embeddingError);
      }
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "An error occurred during upload" },
      { status: 500 }
    );
  }
}
