-- CreateEnum
CREATE TYPE "SongStatus" AS ENUM ('APRENDENDO', 'LAPIDANDO', 'DOMINADA', 'MANUTENCAO');

-- CreateEnum
CREATE TYPE "ChordFormat" AS ENUM ('TRADICIONAL', 'GRADE');

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "genres" TEXT[],
    "version" TEXT,
    "key" TEXT NOT NULL,
    "capo" INTEGER,
    "tuning" TEXT NOT NULL DEFAULT 'standard',
    "bpm" INTEGER,
    "difficulty" INTEGER,
    "status" "SongStatus" NOT NULL DEFAULT 'APRENDENDO',
    "chordFormat" "ChordFormat" NOT NULL,
    "chordContent" TEXT NOT NULL,
    "referenceYoutubeUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER,
    "notes" TEXT,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "durationMin" INTEGER,
    "notes" TEXT,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repertoire" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repertoire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepertoireSong" (
    "repertoireId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "order" INTEGER,

    CONSTRAINT "RepertoireSong_pkey" PRIMARY KEY ("repertoireId","songId")
);

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepertoireSong" ADD CONSTRAINT "RepertoireSong_repertoireId_fkey" FOREIGN KEY ("repertoireId") REFERENCES "Repertoire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepertoireSong" ADD CONSTRAINT "RepertoireSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
