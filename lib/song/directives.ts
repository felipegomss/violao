export type DerivedFields = {
  title: string
  artists: string[]
  key: string
  genres: string[]
  version?: string
  capo?: number
  tuning: string
  bpm?: number
  referenceYoutubeUrl?: string
}

export type DirectiveSpec = {
  key: string
  field: keyof DerivedFields
  label: string
  required?: boolean // usado pelo painel do editor (bloqueia o submit se faltar)
}

export const DIRECTIVES: DirectiveSpec[] = [
  { key: 'title', field: 'title', label: 'Título', required: true },
  { key: 'artist', field: 'artists', label: 'Artista', required: true },
  { key: 'tom', field: 'key', label: 'Tom', required: true },
  { key: 'genero', field: 'genres', label: 'Gêneros' },
  { key: 'versao', field: 'version', label: 'Versão' },
  { key: 'capo', field: 'capo', label: 'Capotraste' },
  { key: 'afinacao', field: 'tuning', label: 'Afinação' },
  { key: 'bpm', field: 'bpm', label: 'BPM' },
  { key: 'youtube', field: 'referenceYoutubeUrl', label: 'YouTube' },
]

export const PANEL_FIELDS = DIRECTIVES

const DIRECTIVE_LINE = /^\s*\{(\w+):\s?(.*)\}\s*$/

function rawDirectives(content: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const line of content.split('\n')) {
    const m = line.match(DIRECTIVE_LINE)
    if (m && !map.has(m[1])) map.set(m[1], m[2].trim())
  }
  return map
}

function toIntOrUndefined(v: string): number | undefined {
  if (!v.trim()) return undefined
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) ? undefined : n
}

export function parseDirectives(content: string): DerivedFields {
  const raw = rawDirectives(content)
  const get = (k: string) => raw.get(k) ?? ''
  const genero = get('genero')
  return {
    title: get('title'),
    artists: get('artist')
      ? get('artist').split(',').map((a) => a.trim()).filter(Boolean)
      : [],
    key: get('tom'),
    genres: genero
      ? genero.split(',').map((g) => g.trim()).filter(Boolean)
      : [],
    version: get('versao') || undefined,
    capo: toIntOrUndefined(get('capo')),
    tuning: get('afinacao') || 'standard',
    bpm: toIntOrUndefined(get('bpm')),
    referenceYoutubeUrl: get('youtube') || undefined,
  }
}

export function setDirective(
  content: string,
  key: string,
  value: string,
): string {
  const lines = content.split('\n')
  const idx = lines.findIndex((l) => l.match(DIRECTIVE_LINE)?.[1] === key)
  const newLine = `{${key}: ${value}}`
  if (idx >= 0) {
    lines[idx] = newLine
    return lines.join('\n')
  }
  return [newLine, ...lines].join('\n')
}

// Valor cru (não-trimado) de uma diretiva no texto, ou '' se ausente.
// Untrimmed de propósito: liga inputs controlados sem "comer" espaços digitados.
export function getDirective(content: string, key: string): string {
  for (const line of content.split('\n')) {
    const m = line.match(DIRECTIVE_LINE)
    if (m && m[1] === key) return m[2]
  }
  return ''
}

export const SCAFFOLD = `{title: }
{artist: }
{tom: }
{genero: }
{versao: }
{capo: }
{afinacao: standard}
{bpm: }
{youtube: }
[C]Cole aqui a letra com os [G]acordes...`
