import { NextResponse } from "next/server";
import Ably from "ably";
import { auth } from "@/lib/auth";
import { env } from "@/env";
import { db } from "@/server/db";

export async function GET(request: Request) {
  if (!env.ABLY_API_KEY) {
    return NextResponse.json(
      { error: "Ably not configured" },
      { status: 503 }
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Require a projectId query param and verify the user has membership
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const projectMember = await db.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: session.user.id,
        projectId,
      },
    },
    select: { id: true },
  });

  if (!projectMember) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const ably = new Ably.Rest({ key: env.ABLY_API_KEY });
  const tokenRequest = await ably.auth.createTokenRequest({
    clientId: session.user.id,
    capability: {
      [`project:${projectId}:gantt`]: ["subscribe", "presence", "publish"],
    },
    ttl: 60 * 60 * 1000, // 1 hour
  });

  return NextResponse.json(tokenRequest);
}
