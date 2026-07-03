import type { ImportResult } from './engine'
import { isCifraClub, parseCifraClub } from './cifraclub'
import { isCifras, parseCifras } from './cifras'

// Registro de fontes de import. Pra somar uma fonte nova: escreve o adaptador
// (normaliza o HTML pro motor) e adiciona uma entrada aqui.
export type ImportSource = {
  name: string
  matches: (host: string) => boolean
  parse: (html: string) => ImportResult
}

export const SOURCES: ImportSource[] = [
  { name: 'Cifra Club', matches: isCifraClub, parse: parseCifraClub },
  { name: 'Cifras', matches: isCifras, parse: parseCifras },
]

export function resolveSource(host: string): ImportSource | null {
  return SOURCES.find((s) => s.matches(host)) ?? null
}

export const SOURCE_NAMES = SOURCES.map((s) => s.name)
