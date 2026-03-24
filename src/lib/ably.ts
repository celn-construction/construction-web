import "server-only";
import Ably from "ably";
import { env } from "@/env";

let ablyRestClient: Ably.Rest | null = null;

/**
 * Lazy singleton Ably REST client for server-side publishing.
 * Returns null when ABLY_API_KEY is not configured (graceful no-op in dev).
 */
export function getAblyRest(): Ably.Rest | null {
  if (!env.ABLY_API_KEY) return null;
  if (!ablyRestClient) {
    ablyRestClient = new Ably.Rest({ key: env.ABLY_API_KEY });
  }
  return ablyRestClient;
}
