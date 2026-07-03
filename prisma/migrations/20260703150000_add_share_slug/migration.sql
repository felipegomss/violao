-- AlterTable
ALTER TABLE "Repertoire" ADD COLUMN     "shareSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Repertoire_shareSlug_key" ON "Repertoire"("shareSlug");

