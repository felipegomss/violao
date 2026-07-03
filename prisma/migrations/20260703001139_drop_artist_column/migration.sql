-- Coluna migrada para "artists" (String[]); dado preservado no split anterior.
ALTER TABLE "Song" DROP COLUMN "artist";
