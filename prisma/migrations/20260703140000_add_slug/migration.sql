-- AlterTable
ALTER TABLE "Repertoire" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Repertoire_userId_slug_key" ON "Repertoire"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Song_userId_slug_key" ON "Song"("userId", "slug");

