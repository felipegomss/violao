export type ChordFormat = 'TRADICIONAL' | 'GRADE'

export type DerivedFields = {
  title: string
  artist: string
  key: string
  genres: string[]
  version?: string
  capo?: number
  tuning: string
  bpm?: number
  referenceYoutubeUrl?: string
  chordFormat: ChordFormat
}

export type DirectiveSpec = {
  key: string
  field: keyof DerivedFields
  label: string
  required?: boolean // usado pelo painel do editor (bloqueia o submit se faltar)
}

export const DIRECTIVES: DirectiveSpec[] = [
  { key: 'title', field: 'title', label: 'Título', required: true },
  { key: 'artist', field: 'artist', label: 'Artista', required: true },
  { key: 'tom', field: 'key', label: 'Tom', required: true },
  { key: 'genero', field: 'genres', label: 'Gêneros' },
  { key: 'versao', field: 'version', label: 'Versão' },
  { key: 'capo', field: 'capo', label: 'Capotraste' },
  { key: 'afinacao', field: 'tuning', label: 'Afinação' },
  { key: 'bpm', field: 'bpm', label: 'BPM' },
  { key: 'youtube', field: 'referenceYoutubeUrl', label: 'YouTube' },
  { key: 'tipo', field: 'chordFormat', label: 'Formato' },
]

export const PANEL_FIELDS = DIRECTIVES.filter((d) => d.key !== 'tipo')

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
    artist: get('artist'),
    key: get('tom'),
    genres: genero
      ? genero.split(',').map((g) => g.trim()).filter(Boolean)
      : [],
    version: get('versao') || undefined,
    capo: toIntOrUndefined(get('capo')),
    tuning: get('afinacao') || 'standard',
    bpm: toIntOrUndefined(get('bpm')),
    referenceYoutubeUrl: get('youtube') || undefined,
    chordFormat: get('tipo').toLowerCase() === 'grade' ? 'GRADE' : 'TRADICIONAL',
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

const HEADER = `{title: }
{artist: }
{tom: }
{genero: }
{versao: }
{capo: }
{afinacao: standard}
{bpm: }
{youtube: }`

export const SCAFFOLD_TRADICIONAL = `${HEADER}
{tipo: tradicional}
[C]Cole aqui a letra com os [G]acordes...`

export const SCAFFOLD_GRADE = `${HEADER}
{tipo: grade}
{parte: A}
| C7M | G/B | Am7 | C7/G |`

export function toggleFormat(content: string, target: ChordFormat): string {
  const pristineOther =
    target === 'GRADE' ? SCAFFOLD_TRADICIONAL : SCAFFOLD_GRADE
  // Scaffold intocado (tolerante a espaço/linha em branco nas bordas) → troca o
  // scaffold inteiro; senão preserva o corpo digitado e só troca {tipo}.
  if (content.trim() === pristineOther.trim()) {
    return target === 'GRADE' ? SCAFFOLD_GRADE : SCAFFOLD_TRADICIONAL
  }
  return setDirective(content, 'tipo', target === 'GRADE' ? 'grade' : 'tradicional')
}
