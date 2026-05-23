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

    const taskChanges = body.tasks as { added?: Array<Record<string, unknown>>; updated?: Array<Record<string, unknown>>; removed?: Array<Record<string, unknown>> } | undefined;
    console.log('[Gantt:sync] Incoming request — projectId:', projectId,
      'tasks: +' + (taskChanges?.added?.length ?? 0),
      '~' + (taskChanges?.updated?.length ?? 0),
      '-' + (taskChanges?.removed?.length ?? 0));

    // Full-list payload dumps fire on every autosync (~500ms during edits) and
    // balloon Vercel log volume. Keep the per-sync counts above, and only emit
    // the full breakdown when GANTT_SYNC_DEBUG is set or in development.
    const verbose = process.env.NODE_ENV !== 'production' || process.env.GANTT_SYNC_DEBUG === '1';
    if (verbose && (taskChanges?.added?.length ?? 0) > 0) {
      console.log('[Gantt:sync] Added tasks (full list):', JSON.stringify(
        taskChanges?.added?.map((t) => ({
          $PhantomId: t.$PhantomId,
          id: t.id,
          name: t.name,
          parentId: t.parentId,
          startDate: t.startDate,
          duration: t.duration,
          keys: Object.keys(t),
        })),
        null,
        2,
      ));
    }
    if (verbose && (taskChanges?.updated?.length ?? 0) > 0) {
      console.log('[Gantt:sync] Updated tasks (full list):', JSON.stringify(
        taskChanges?.updated?.map((t) => ({
          id: t.id,
          parentId: t.parentId,
          changedKeys: Object.keys(t).filter((k) => k !== 'id'),
        })),
        null,
        2,
      ));
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

    const typedResult = result as { tasks?: { rows?: Array<{ id?: string; $PhantomId?: string }> } };
    const rows = typedResult.tasks?.rows ?? [];
    if (verbose) {
      console.log('[Gantt:sync] Success — task rows returned:', rows.length, 'mapping:',
        JSON.stringify(rows.map((r) => ({ phantom: r.$PhantomId, real: r.id })), null, 2));
    } else {
      console.log('[Gantt:sync] Success — task rows returned:', rows.length);
    }

    return NextResponse.json(result);
  } catch (error) {
    // Always return HTTP 200 with `{ success: false }`. Non-200 responses push
    // Bryntum's CrudManager into `onCrudRequestFailure`, which crashes while
    // iterating in-flight records ("Cannot set properties of undefined (setting
    // 'isBeingMaterialized')"). 200 + success:false routes through `onCrudFailure`,
    // which is safe, and the response is still surfaced via the `syncFail` listener.
    if (error instanceof TRPCError) {
      console.error('[Gantt:sync] tRPC error:', error.code, error.message);
      return NextResponse.json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    console.error("[Gantt:sync:route] Unexpected error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
