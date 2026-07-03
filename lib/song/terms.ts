// Normaliza uma lista de termos livres (gêneros, artistas): apara, remove
// vazios, dedup ignorando caso/espaços, e adota a grafia que JÁ existe no
// acervo (pra "samba" não virar um duplicado de "Samba").
export function canonicalTerms(incoming: string[], existing: string[]): string[] {
  const canon = new Map<string, string>() // chave em minúsculo -> grafia canônica
  for (const e of existing) {
    const key = e.trim().toLowerCase()
    if (key && !canon.has(key)) canon.set(key, e.trim())
  }

  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of incoming) {
    const term = raw.trim()
    if (!term) continue
    const key = term.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const chosen = canon.get(key) ?? term
    if (!canon.has(key)) canon.set(key, chosen)
    out.push(chosen)
  }
  return out
}
