'use server'

import { verifySession } from '@/lib/auth'
import { chordDiagram, type ChordShape } from '@/lib/chords/diagram'

// Busca a digitação de um acorde (chords-db fica só no servidor).
export async function getChordDiagram(token: string): Promise<ChordShape | null> {
  await verifySession()
  return chordDiagram(token)
}
