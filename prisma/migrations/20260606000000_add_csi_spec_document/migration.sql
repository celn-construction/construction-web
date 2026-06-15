-- CreateTable
CREATE TABLE "CsiSpecDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "csiCode" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CsiSpecDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CsiSpecDocument_documentId_key" ON "CsiSpecDocument"("documentId");

-- CreateIndex
CREATE INDEX "CsiSpecDocument_projectId_idx" ON "CsiSpecDocument"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "CsiSpecDocument_projectId_csiCode_key" ON "CsiSpecDocument"("projectId", "csiCode");

-- AddForeignKey
ALTER TABLE "CsiSpecDocument" ADD CONSTRAINT "CsiSpecDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsiSpecDocument" ADD CONSTRAINT "CsiSpecDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
