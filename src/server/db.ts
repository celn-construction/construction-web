import { env } from "@/env";
import { PrismaClient } from "../../generated/prisma";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prismaV2: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prismaV2 ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prismaV2 = db;
