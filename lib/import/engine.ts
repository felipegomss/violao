// Motor de import compartilhado. Recebe o INNER de um <pre> já NORMALIZADO
// (acordes em <b>, seções em [colchetes], tabs do CifraClub em <span class="cnt">)
// + metadados, e devolve o ChordPro. O merge acorde↔letra é por coluna.

export type ImportMeta = { title: string; artist: string; key: string; version?: string }
export type ImportResult = ImportMeta & { content: string }

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
}

// Pega o conteúdo interno do primeiro <pre>…</pre>.
export function preInner(html: string): string {
  const start = html.indexOf('<pre')
  const end = html.indexOf('</pre>')
  if (start < 0 || end < 0) return ''
  return html.slice(html.indexOf('>', start) + 1, end)
}

type Line = { plain: string; chords: { col: number; text: string }[] }

function parseLine(line: string): Line {
  let col = 0
  let plain = ''
  const chords: { col: number; text: string }[] = []
  let i = 0
  while (i < line.length) {
    if (line.startsWith('<b>', i) || line.startsWith('<b ', i)) {
      const open = line.indexOf('>', i)
      const end = line.indexOf('</b>', open)
      const chord = decodeEntities(line.slice(open + 1, end).replace(/<[^>]+>/g, '')).trim()
      if (chord) chords.push({ col, text: chord })
      plain += chord
      col += chord.length
      i = end + 4
    } else if (line[i] === '<') {
      const gt = line.indexOf('>', i)
      i = gt < 0 ? line.length : gt + 1
    } else {
      const next = line.indexOf('<', i)
      const seg = decodeEntities(line.slice(i, next < 0 ? undefined : next))
      plain += seg
      col += seg.length
      i = next < 0 ? line.length : next
    }
  }
  return { plain, chords }
}

function merge(lyric: string, chords: { col: number; text: string }[]): string {
  let out = lyric
  for (const c of [...chords].sort((a, b) => b.col - a.col)) {
    out =
      c.col >= out.length
        ? out.padEnd(c.col) + `[${c.text}]`
        : out.slice(0, c.col) + `[${c.text}]` + out.slice(c.col)
  }
  return out.replace(/\s+$/, '')
}

function insideTab(out: string[]): boolean {
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i] === '{end_of_tab}') return false
    if (out[i] === '{start_of_tab}') return true
  }
  return false
}

function rebase(chords: { col: number; text: string }[], plain: string): { col: number; text: string }[] {
  const base = plain.indexOf(']') + 1
  return chords.map((c) => ({ col: Math.max(0, c.col - base), text: c.text }))
}

export function toChordPro(meta: ImportMeta, preNormalized: string): ImportResult {
  // Fontes minificadas às vezes separam linhas com \r (Cifras faz isso).
  let pre = preNormalized.replace(/\r\n?/g, '\n')
  pre = pre.replace(
    /<span class="cnt">([\s\S]*?)<\/span>/g,
    (_m, tab) => `\n@@SOT@@\n${tab.replace(/<[^>]+>/g, '')}\n@@EOT@@`,
  )
  pre = pre.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '')

  const out: string[] = []
  let pending: Line | null = null
  const flush = () => {
    if (pending) {
      out.push(pending.chords.map((c) => `[${c.text}]`).join(' '))
      pending = null
    }
  }

  for (const raw of pre.split('\n')) {
    const t = raw.trim()
    if (t === '@@SOT@@') {
      flush()
      out.push('{start_of_tab}')
      continue
    }
    if (t === '@@EOT@@') {
      out.push('{end_of_tab}')
      continue
    }
    if (out.length && out[out.length - 1] !== '{end_of_tab}' && insideTab(out)) {
      out.push(raw.replace(/<[^>]+>/g, ''))
      continue
    }
    const { plain, chords } = parseLine(raw)
    if (plain.trim() === '') {
      flush()
      if (out[out.length - 1] !== '') out.push('')
      continue
    }
    const sec = plain.match(/^\s*\[([^\]]+)\]\s*(.*)$/)
    if (sec) {
      flush()
      out.push(`{comment: ${sec[1].trim()}}`)
      const after = chords.filter((c) => c.col >= plain.indexOf(']'))
      if (after.length) pending = { plain: sec[2], chords: rebase(after, plain) }
      continue
    }
    if (chords.length > 0) {
      flush()
      pending = { plain, chords }
      continue
    }
    if (pending) {
      out.push(merge(plain, pending.chords))
      pending = null
    } else {
      out.push(plain.replace(/\s+$/, ''))
    }
  }
  flush()

  const body = out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  const content = [
    `{title: ${meta.title}}`,
    `{artist: ${meta.artist}}`,
    `{tom: ${meta.key}}`,
    `{genero: }`,
    `{versao: ${meta.version ?? ''}}`,
    `{capo: }`,
    `{afinacao: standard}`,
    `{bpm: }`,
    `{youtube: }`,
    '',
    body,
  ].join('\n')

  return { ...meta, content }
}
