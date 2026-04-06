# Embeddings & Hybrid Search

## Overview

The document explorer uses a hybrid search system combining OpenAI vector embeddings (semantic) and PostgreSQL full-text search (keyword), merged via Reciprocal Rank Fusion (RRF). When a user toggles AI search on, their query is processed through both paths and results are ranked by combined RRF score.

## Key Files

| File | Purpose |
|------|---------|
| `src/server/services/embeddings.ts` | OpenAI SDK wrapper — `embedDocuments()`, `embedQuery()`, `toVectorSql()` |
| `src/server/api/routers/document.ts` | `document.aiSearch` procedure — calls `hybrid_document_search()` PostgreSQL function |
| `src/app/api/upload/route.ts` | Generates embedding after document upload |
| `src/lib/constants/constructionAcronyms.ts` | Construction acronym expansion for keyword search (e.g. `RFI` → `request for information`) |
| `prisma/migrations/20260405000000_hybrid_search/migration.sql` | `hybrid_document_search()` function, `searchVector` generated column, GIN index |

## Tech Stack

- **Embedding model**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Vector storage**: pgvector extension in Neon PostgreSQL
- **Vector column**: `Document.embedding` (`vector(1536)`, nullable)
- **Keyword column**: `Document.searchVector` (`tsvector`, generated from `name + description + tags`)
- **Search function**: `hybrid_document_search()` — vector similarity + keyword matching + RRF merge
- **Distance function**: Cosine distance (`<=>` operator) for vector path, `ts_rank` for keyword path
- **Merge algorithm**: Reciprocal Rank Fusion (RRF) with k=60
- **Prisma integration**: `Unsupported("vector(1536)")` + `$queryRaw` with `pgvector` npm `toSql()`

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | For AI search | OpenAI API key (get from platform.openai.com) |

## What Gets Embedded

On upload, the route embeds: `"<filename without extension>. <AI description>. Tags: <tag1>, <tag2>, .... File type: <EXT>"`.

This ensures the filename, semantic content, and file type are all searchable — e.g. a file named `cats.jpg` with description "a photo of cats" will match queries like "cats", "animals", "photos of pets", or "JPEG images".

## How Hybrid Search Works

1. User query is embedded via OpenAI for the vector path
2. User query is expanded via `expandAcronyms()` for the keyword path (e.g. `MEP RFI` → `MEP mechanical electrical plumbing RFI request for information`)
3. The `hybrid_document_search()` PostgreSQL function runs both paths in parallel:
   - **Vector path**: top-100 documents by cosine distance to query embedding
   - **Keyword path**: top-100 documents matching `websearch_to_tsquery` on the `searchVector` column
4. Results are merged via RRF: `score = 1/(60 + vector_rank) + 1/(60 + keyword_rank)`
5. Final results are sorted by RRF score and paginated

## Important Notes

- Prisma doesn't natively support vector types — all vector operations use `$queryRaw` / `$executeRaw`
- The `aiSearch` procedure calls a single `hybrid_document_search()` PostgreSQL function that handles both vector and keyword search paths, folder filtering, and pagination
- Embeddings are generated non-blocking on upload — if it fails, the upload still succeeds
- Documents uploaded before `OPENAI_API_KEY` was configured have `embedding = NULL` and will only appear in keyword search results (re-upload to get embeddings)
- The `searchVector` column is a generated column — it auto-updates on every INSERT/UPDATE with no application code needed
- At scale (5K+ documents), add an HNSW index: `CREATE INDEX ON "Document" USING hnsw (embedding vector_cosine_ops)`
