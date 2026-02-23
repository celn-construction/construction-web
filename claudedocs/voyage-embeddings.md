# Voyage AI Embeddings Integration

## Overview

The document explorer uses Voyage AI vector embeddings for semantic (AI) search. When a user toggles AI search on, their natural language query is embedded and compared against pre-computed document description embeddings using pgvector's cosine similarity.

## Key Files

| File | Purpose |
|------|---------|
| `src/server/services/embeddings.ts` | Voyage AI SDK wrapper — `embedDocuments()`, `embedQuery()`, `toVectorSql()` |
| `src/server/api/routers/document.ts` | `document.aiSearch` procedure — vector similarity search |
| `src/app/api/upload/route.ts` | Generates embedding after document upload |

## Tech Stack

- **Embedding model**: Voyage AI `voyage-4-lite` (1024 dimensions)
- **Vector storage**: pgvector extension in Neon PostgreSQL
- **Vector column**: `Document.embedding` (`vector(1024)`, nullable)
- **Distance function**: Cosine distance (`<=>` operator)
- **Prisma integration**: `Unsupported("vector(1024)")` + `$queryRaw` with `pgvector` npm `toSql()`

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VOYAGE_API_KEY` | For AI search | Voyage AI API key (200M token free tier at dash.voyageai.com) |

## Important Notes for Future Development

- **Always use Context7 docs** when working on embedding features: library ID `/websites/voyageai` for Voyage AI docs, `/pgvector/pgvector-node` for pgvector-node docs
- Voyage uses `input_type: "document"` for storage and `input_type: "query"` for retrieval — these must match
- The `pgvector` npm package's `toSql()` converts `number[]` to PostgreSQL vector literal format
- Prisma doesn't natively support vector types — all vector operations use `$queryRaw` / `$executeRaw`
- At scale (5K+ documents), add an HNSW index: `CREATE INDEX ON "Document" USING hnsw (embedding vector_cosine_ops)`
