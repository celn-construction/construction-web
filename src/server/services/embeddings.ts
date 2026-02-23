import { VoyageAIClient } from "voyageai";
import pgvector from "pgvector";
import { env } from "@/env";

const MODEL = "voyage-4-lite";

function getClient(): VoyageAIClient {
  if (!env.VOYAGE_API_KEY) {
    throw new Error(
      "VOYAGE_API_KEY is not set. Embedding features are unavailable."
    );
  }
  return new VoyageAIClient({ apiKey: env.VOYAGE_API_KEY });
}

/**
 * Generate embeddings for a batch of document descriptions.
 * Uses input_type "document" for storage-time embedding.
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const client = getClient();
  const response = await client.embed({
    input: texts,
    model: MODEL,
    inputType: "document",
  });
  return response.data?.map((d) => d.embedding!) ?? [];
}

/**
 * Generate an embedding for a search query.
 * Uses input_type "query" for retrieval-time embedding.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const client = getClient();
  const response = await client.embed({
    input: [text],
    model: MODEL,
    inputType: "query",
  });
  const embedding = response.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Failed to generate query embedding");
  }
  return embedding;
}

/** Convert a number[] embedding to a SQL-safe string for pgvector. */
export function toVectorSql(embedding: number[]): string {
  return pgvector.toSql(embedding);
}
