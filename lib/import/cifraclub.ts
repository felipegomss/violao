// Converte o HTML de uma página de cifra do CifraClub no nosso ChordPro.
// A cifra vive num <pre>: acordes em <b>, seções em [colchetes], tabs em
// <span class="cnt">. O merge acorde↔letra é por coluna (o <pre> é monospace).

export type CifraClubParse = {
  title: string
  artist: string
  key: string
  content: string
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
}

type Line = { plain: string; chords: { col: number; text: string }[] }

// Lê uma linha do <pre> rastreando a coluna visível; texto em <b> é acorde.
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

// Insere [acorde] na letra nas colunas certas (da direita p/ esquerda).
function merge(lyric: string, chords: { col: number; text: string }[]): string {
  let out = lyric
  for (const c of [...chords].sort((a, b) => b.col - a.col)) {
    out = c.col >= out.length ? out.padEnd(c.col) + `[${c.text}]` : out.slice(0, c.col) + `[${c.text}]` + out.slice(c.col)
  }
  return out.replace(/\s+$/, '')
}

function extractPre(html: string): string {
  const start = html.indexOf('<pre')
  const end = html.indexOf('</pre>')
  if (start < 0 || end < 0) return ''
  let pre = html.slice(html.indexOf('>', start) + 1, end)
  // tabs: <span class="cnt">TAB</span> -> bloco {start_of_tab}
  pre = pre.replace(
    /<span class="cnt">([\s\S]*?)<\/span>/g,
    (_m, tab) => `\n@@SOT@@\n${tab.replace(/<[^>]+>/g, '')}\n@@EOT@@`,
  )
  pre = pre.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '')
  return pre
}

export function parseCifraClub(html: string): CifraClubParse {
  const titleTag = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? ''
  const parts = titleTag.split(' - ').map((p) => decodeEntities(p).trim())
  const title = parts[0] ?? ''
  const artist = parts[1] ?? ''
  const key =
    html.match(/\btom:\s*<[^>]*>(?:\s*<[^>]*>)?\s*([A-G][#b]?m?)\b/i)?.[1] ?? ''

  const pre = extractPre(html)
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
    // dentro de um bloco de tab: repassa a linha crua
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
      // acordes que sobrarem na mesma linha da seção viram chord-only/pending
      const after = chords.filter((c) => c.col >= plain.indexOf(']') )
      if (after.length) pending = { plain: sec[2], chords: rebase(after, plain) }
      continue
    }
    if (chords.length > 0) {
      flush()
      pending = { plain, chords }
      continue
    }
    // linha de letra
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
    `{title: ${title}}`,
    `{artist: ${artist}}`,
    `{tom: ${key}}`,
    `{genero: }`,
    `{versao: Cifra Club}`,
    `{capo: }`,
    `{afinacao: standard}`,
    `{bpm: }`,
    `{youtube: }`,
    '',
    body,
  ].join('\n')

  return { title, artist, key, content }
}

// heurística: estamos "dentro" de um tab se o último SOT ainda não fechou.
function insideTab(out: string[]): boolean {
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i] === '{end_of_tab}') return false
    if (out[i] === '{start_of_tab}') return true
  }
  return false
}

// reposiciona colunas de acordes de uma seção pro início da letra restante.
function rebase(chords: { col: number; text: string }[], plain: string): { col: number; text: string }[] {
  const base = plain.indexOf(']') + 1
  return chords.map((c) => ({ col: Math.max(0, c.col - base), text: c.text }))
}
