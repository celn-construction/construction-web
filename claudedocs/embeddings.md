# Embeddings Integration

## Overview

The document explorer uses OpenAI vector embeddings for semantic (AI) search. When a user toggles AI search on, their natural language query is embedded and compared against pre-computed document embeddings using pgvector's cosine similarity.

## Key Files

| File | Purpose |
|------|---------|
| `src/server/services/embeddings.ts` | OpenAI SDK wrapper — `embedDocuments()`, `embedQuery()`, `toVectorSql()` |
| `src/server/api/routers/document.ts` | `document.aiSearch` procedure — vector similarity search |
| `src/app/api/upload/route.ts` | Generates embedding after document upload |

## Tech Stack

- **Embedding model**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Vector storage**: pgvector extension in Neon PostgreSQL
- **Vector column**: `Document.embedding` (`vector(1536)`, nullable)
- **Distance function**: Cosine distance (`<=>` operator)
- **Prisma integration**: `Unsupported("vector(1536)")` + `$queryRaw` with `pgvector` npm `toSql()`

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | For AI search | OpenAI API key (get from platform.openai.com) |

## What Gets Embedded

On upload, the route embeds: `"<filename without extension>. <AI description>. Tags: <tag1>, <tag2>, ..."`.

This ensures both the filename and semantic content are searchable — e.g. a file named `cats.jpg` with description "a photo of cats" will match queries like "cats", "animals", or "photos of pets".

## Important Notes

- Prisma doesn't natively support vector types — all vector operations use `$queryRaw` / `$executeRaw`
- The `aiSearch` procedure uses two conditional query branches (with/without folder filter) to avoid `Prisma.empty`, which breaks `$queryRaw` parameter numbering
- Embeddings are generated non-blocking on upload — if it fails, the upload still succeeds
- Documents uploaded before `OPENAI_API_KEY` was configured have `embedding = NULL` and won't appear in AI search results (re-upload to get embeddings)
- At scale (5K+ documents), add an HNSW index: `CREATE INDEX ON "Document" USING hnsw (embedding vector_cosine_ops)`
