import { NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { getActiveOrganizationId } from "@/server/api/helpers/getActiveOrganization";
import { db } from "@/server/db";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "projectId is required" },
        { status: 400 }
      );
    }

    // Get user's active organization
    const organizationId = await getActiveOrganizationId(db, session.user.id);

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: "No active organization" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json() as Record<string, unknown>;

    const taskChanges = body.tasks as { added?: unknown[]; updated?: Array<Record<string, unknown>>; removed?: unknown[] } | undefined;
    console.log('[Gantt:sync] Incoming request — projectId:', projectId,
      'tasks: +' + (taskChanges?.added?.length ?? 0),
      '~' + (taskChanges?.updated?.length ?? 0),
      '-' + (taskChanges?.removed?.length ?? 0));
    if (taskChanges?.updated) {
      for (const t of taskChanges.updated) {
        console.log('[Gantt:sync] Updated task in payload:', t.id, '— version:', t.version, 'typeof version:', typeof t.version);
      }
    }

    // Create tRPC context and caller
    const ctx = await createTRPCContext({
      headers: request.headers,
    });

    const caller = createCaller(ctx);

    // Call tRPC sync procedure
    const result = await caller.gantt.sync({
      organizationId,
      projectId,
      ...body,
    });

    console.log('[Gantt:sync] Success — task rows returned:', (result as { tasks?: { rows?: unknown[] } }).tasks?.rows?.length ?? 0);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TRPCError) {
      // Version conflicts return HTTP 200 with conflict flag so Bryntum's CrudManager
      // doesn't show its built-in error popup (which intercepts non-200 responses).
      // We detect the conflict in the client-side 'sync' handler instead.
      if (error.code === 'CONFLICT') {
        console.log('[Gantt:sync] CONFLICT:', error.message);
        return NextResponse.json({
          success: true,
          conflict: true,
          message: error.message,
          tasks: { rows: [] },
          dependencies: { rows: [] },
          resources: { rows: [] },
          assignments: { rows: [] },
          timeRanges: { rows: [] },
        });
      }
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        FORBIDDEN: 403,
        UNAUTHORIZED: 401,
        BAD_REQUEST: 400,
      };
      const status = statusMap[error.code] ?? 500;
      return NextResponse.json(
        { success: false, message: error.message },
        { status }
      );
    }
    console.error("[Gantt:sync:route] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
