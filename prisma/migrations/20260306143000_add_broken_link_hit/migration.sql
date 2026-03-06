-- CreateTable
CREATE TABLE "BrokenLinkHit" (
  "id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "referrer" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BrokenLinkHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrokenLinkHit_createdAt_idx" ON "BrokenLinkHit"("createdAt");

-- CreateIndex
CREATE INDEX "BrokenLinkHit_path_idx" ON "BrokenLinkHit"("path");
