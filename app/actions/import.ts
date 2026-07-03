'use server'

import { verifySession } from '@/lib/auth'
import { parseCifraClub } from '@/lib/import/cifraclub'

export type ImportState = { content?: string; error?: string }

export async function importCifraClub(url: string): Promise<ImportState> {
  await verifySession()

  let host: string
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return { error: 'Esse link não parece válido.' }
  }
  if (host !== 'cifraclub.com.br' && !host.endsWith('.cifraclub.com.br')) {
    return { error: 'Por enquanto só importo link do CifraClub.' }
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

  const parsed = parseCifraClub(html)
  if (!parsed.title || !parsed.content.includes('[')) {
    return { error: 'Não achei uma cifra nessa página. É uma página de cifra do CifraClub?' }
  }
  return { content: parsed.content }
}
