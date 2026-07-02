/*
  Warnings:

  - You are about to drop the column `difficulty` on the `Song` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Song` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Song" DROP COLUMN "difficulty",
DROP COLUMN "status",
ADD COLUMN     "comoEstouTocando" INTEGER;

-- DropEnum
DROP TYPE "SongStatus";
