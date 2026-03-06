-- CreateTable
CREATE TABLE "ExternalLinkCheck" (
  "id" TEXT NOT NULL,
  "sourcePath" TEXT,
  "targetUrl" TEXT NOT NULL,
  "finalUrl" TEXT,
  "statusCode" INTEGER,
  "isError" BOOLEAN NOT NULL DEFAULT false,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ExternalLinkCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalLinkCheck_createdAt_idx" ON "ExternalLinkCheck"("createdAt");

-- CreateIndex
CREATE INDEX "ExternalLinkCheck_isError_createdAt_idx" ON "ExternalLinkCheck"("isError", "createdAt");
