import OpenAI from "openai";
import pgvector from "pgvector";
import { env } from "@/env";

const MODEL = "text-embedding-3-small";
const DIMENSIONS = 1536; // DB column is vector(1536) — text-embedding-3-small default

function getClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Embedding features are unavailable."
    );
  }
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

/** Generate embeddings for a batch of texts (documents). */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const client = getClient();
  const response = await client.embeddings.create({ model: MODEL, input: texts, dimensions: DIMENSIONS });
  return response.data.map((d) => d.embedding);
}

/** Generate an embedding for a search query. */
export async function embedQuery(text: string): Promise<number[]> {
  const client = getClient();
  const response = await client.embeddings.create({ model: MODEL, input: [text], dimensions: DIMENSIONS });
  const embedding = response.data[0]?.embedding;
  if (!embedding) {
    throw new Error("Failed to generate query embedding");
  }
  return embedding;
}

/** Convert a number[] embedding to a SQL-safe string for pgvector. */
export function toVectorSql(embedding: number[]): string {
  return pgvector.toSql(embedding);
}
