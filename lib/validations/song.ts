import { z } from 'zod'

export const CHORD_FORMAT = ['TRADICIONAL', 'GRADE'] as const

export const SongSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  artists: z.array(z.string().trim().min(1)).min(1, 'Artista é obrigatório'),
  key: z.string().trim().min(1, 'Tom é obrigatório'),
  genres: z.array(z.string().trim().min(1)).default([]),
  version: z.string().trim().optional(),
  capo: z.number().int().min(0).max(12).optional(),
  tuning: z.string().trim().min(1).default('standard'),
  bpm: z.number().int().min(20).max(400).optional(),
  referenceYoutubeUrl: z.url('URL inválida').optional(),
  chordFormat: z.enum(CHORD_FORMAT),
})

export type SongInput = z.infer<typeof SongSchema>
