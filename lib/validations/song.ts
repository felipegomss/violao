import { z } from 'zod'

export const SONG_STATUS = [
  'APRENDENDO',
  'LAPIDANDO',
  'DOMINADA',
  'MANUTENCAO',
] as const

export const CHORD_FORMAT = ['TRADICIONAL', 'GRADE'] as const

export const SongSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  artist: z.string().trim().min(1, 'Artista é obrigatório'),
  key: z.string().trim().min(1, 'Tom é obrigatório'),
  genres: z.array(z.string().trim().min(1)).default([]),
  version: z.string().trim().optional(),
  capo: z.number().int().min(0).max(12).optional(),
  tuning: z.string().trim().min(1).default('standard'),
  bpm: z.number().int().min(20).max(400).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  status: z.enum(SONG_STATUS),
  chordFormat: z.enum(CHORD_FORMAT),
  chordContent: z.string().default(''),
  referenceYoutubeUrl: z.url('URL inválida').optional(),
  notes: z.string().optional(),
})

export type SongInput = z.infer<typeof SongSchema>
