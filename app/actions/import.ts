'use server'

import { verifySession } from '@/lib/auth'
import { resolveSource, SOURCE_NAMES } from '@/lib/import/sources'

export type ImportState = { content?: string; error?: string }

// Import por link: reconhece a fonte pelo host e converte pro nosso ChordPro.
export async function importFromUrl(url: string): Promise<ImportState> {
  await verifySession()

  let host: string
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return { error: 'Esse link não parece válido.' }
  }

  const source = resolveSource(host)
  if (!source) {
    return { error: `Ainda não conheço esse site. Por enquanto: ${SOURCE_NAMES.join(', ')}.` }
  }

  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Compasso)' },
    })
    if (!res.ok) return { error: 'Não consegui abrir essa página.' }
    html = await res.text()
  } catch {
    return { error: 'Não consegui buscar o link.' }
  }

  const parsed = source.parse(html)
  if (!parsed.title || !parsed.content.includes('[')) {
    return { error: `Não achei uma cifra nessa página do ${source.name}.` }
  }
  return { content: parsed.content }
}
