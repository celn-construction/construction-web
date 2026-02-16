import { NextResponse } from "next/server";
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
    const body = await request.json();

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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gantt sync error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
