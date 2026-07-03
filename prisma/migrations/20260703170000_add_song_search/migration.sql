-- Busca acento-insensível: pg_trgm p/ índice GIN em searchText
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "artistSort" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Song_searchText_idx" ON "Song" USING GIN ("searchText" gin_trgm_ops);
