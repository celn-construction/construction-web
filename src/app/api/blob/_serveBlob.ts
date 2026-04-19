import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

interface ServeBlobOptions {
  blobUrl: string;
  fallbackContentType?: string;
  filename?: string;
}

export async function serveBlob(
  req: NextRequest,
  { blobUrl, fallbackContentType, filename }: ServeBlobOptions,
): Promise<NextResponse> {
  const ifNoneMatch = req.headers.get("if-none-match") ?? undefined;
  const result = await get(blobUrl, { access: "private", ifNoneMatch });

  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  const commonHeaders = {
    ETag: result.blob.etag,
    "Cache-Control": "private, no-cache",
    "X-Content-Type-Options": "nosniff",
  };

  if (result.statusCode === 304) {
    return new NextResponse(null, { status: 304, headers: commonHeaders });
  }

  const headers: Record<string, string> = {
    ...commonHeaders,
    "Content-Type": fallbackContentType ?? result.blob.contentType ?? "application/octet-stream",
    "Content-Length": String(result.blob.size),
  };

  if (filename) {
    headers["Content-Disposition"] = `inline; filename*=UTF-8''${encodeURIComponent(filename)}`;
  }

  return new NextResponse(result.stream, { headers });
}
