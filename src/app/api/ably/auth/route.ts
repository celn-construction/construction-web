import { NextResponse } from "next/server";
import Ably from "ably";
import { auth } from "@/lib/auth";
import { env } from "@/env";

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

  const ably = new Ably.Rest({ key: env.ABLY_API_KEY });
  const tokenRequest = await ably.auth.createTokenRequest({
    clientId: session.user.id,
    capability: {
      "project:*:gantt": ["subscribe", "presence", "publish"],
    },
    ttl: 60 * 60 * 1000, // 1 hour
  });

  return NextResponse.json(tokenRequest);
}
