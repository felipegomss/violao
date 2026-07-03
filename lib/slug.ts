// Gera um slug URL-safe a partir de um texto (título/nome).
export function slugify(input: string): string {
  const s = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
  return s || 'musica'
}

// Dado um slug base e um predicado "já existe?", devolve o primeiro livre
// (base, base-2, base-3…). Usado no create pra garantir unicidade por usuário.
export async function uniqueSlug(
  base: string,
  taken: (slug: string) => Promise<boolean>,
): Promise<string> {
  let candidate = base
  let n = 1
  while (await taken(candidate)) {
    n += 1
    candidate = `${base}-${n}`
  }
  return candidate
}
