/**
 * One-time script to generate embeddings for existing documents.
 *
 * Usage:
 *   npx tsx scripts/backfill-embeddings.ts
 *
 * Requires VOYAGE_API_KEY and DATABASE_URL in environment.
 */

import { PrismaClient } from "../generated/prisma";
import { VoyageAIClient } from "voyageai";
import pgvector from "pgvector";

const BATCH_SIZE = 128;

async function main() {
  if (!process.env.VOYAGE_API_KEY) {
    console.error("VOYAGE_API_KEY is not set");
    process.exit(1);
  }

  const db = new PrismaClient();
  const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

  try {
    // Find documents with descriptions but no embeddings
    const documents = await db.$queryRaw<
      Array<{ id: string; description: string }>
    >`
      SELECT id, description
      FROM "Document"
      WHERE description IS NOT NULL
        AND description != ''
        AND embedding IS NULL
    `;

    console.log(`Found ${documents.length} documents to embed`);

    if (documents.length === 0) {
      console.log("Nothing to do");
      return;
    }

    let processed = 0;

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const texts = batch.map((d) => d.description);

      const response = await voyage.embed({
        input: texts,
        model: "voyage-4-lite",
        inputType: "document",
      });

      const embeddings = response.data ?? [];

      for (let j = 0; j < batch.length; j++) {
        const embedding = embeddings[j]?.embedding;
        if (!embedding) continue;

        const vectorSql = pgvector.toSql(embedding);
        await db.$executeRaw`
          UPDATE "Document"
          SET embedding = ${vectorSql}::vector
          WHERE id = ${batch[j]!.id}
        `;
      }

      processed += batch.length;
      console.log(`Processed ${processed}/${documents.length}`);
    }

    console.log("Done!");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
