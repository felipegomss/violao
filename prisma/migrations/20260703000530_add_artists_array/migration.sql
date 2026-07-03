-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "artists" TEXT[];

-- Preserva o dado existente: split do "artist" (CSV) em "artists" (trim, sem vazios)
UPDATE "Song"
SET "artists" = (
  SELECT array_agg(trim(x))
  FROM unnest(string_to_array("artist", ',')) AS x
  WHERE trim(x) <> ''
)
WHERE "artist" IS NOT NULL AND "artist" <> '';
