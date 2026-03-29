-- CreateEnum
CREATE TYPE "ChangelogReactionType" AS ENUM ('LIKE', 'DISLIKE', 'IMPROVABLE');

-- CreateTable
CREATE TABLE "ChangelogReaction" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "reaction" "ChangelogReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangelogReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChangelogReaction_entryId_idx" ON "ChangelogReaction"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangelogReaction_entryId_visitorId_key" ON "ChangelogReaction"("entryId", "visitorId");
