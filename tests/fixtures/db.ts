import { PrismaClient } from "../../generated/prisma/index.js";

/**
 * Standalone Prisma client for E2E test seeding and cleanup.
 * Connects to the same local PostgreSQL instance as the dev server.
 */
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.construction_POSTGRES_PRISMA_URL ??
        `postgresql://${process.env.USER}@localhost:5433/construction`,
    },
  },
});
