# Fluxo "Nova música" template-first + schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o form de campos avulsos por um editor template-first onde a cifra (diretivas `{}`) é a fonte única da verdade; e alterar o schema (remover `difficulty`/`status`, adicionar `comoEstouTocando`).

**Architecture:** Um parser de diretivas puro/compartilhado (`lib/song/directives.ts`) deriva os metadados do `chordContent`; usado no cliente (editor + painel "Detectado", round-trip via `setDirective`) e no servidor (actions). Ordem das tasks mantém `tsc` verde a cada commit: código para de referenciar `status`/`difficulty` **antes** de a migration dropar as colunas.

**Tech Stack:** Next 16 App Router, React 19, TypeScript, Prisma (Neon), Zod, vitest, Tailwind/shadcn.

---

## Convenções
- nvm antes de node/npx: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null`
- Raiz do worktree; alias `@/*` → raiz; sem `src/`.
- Commit por task; `npx tsc --noEmit` deve passar ao fim de cada task.

## Mapa de arquivos
**Criar:** `lib/song/directives.ts` (+ `directives.test.ts`); `app/songs/song-editor.tsx`; `SPEC.md` (coordenador).
**Modificar:** `lib/validations/song.ts` (+ `song.test.ts`); `app/actions/songs.ts`; `app/songs/new/page.tsx`; `app/songs/[id]/edit/page.tsx`; `app/songs/page.tsx`; `app/songs/[id]/page.tsx`; `prisma/schema.prisma`.
**Remover:** `app/songs/song-form.tsx`.

---

## Task 1: Parser de diretivas + scaffolds (puro, TDD)

**Files:** Create `lib/song/directives.ts`, `lib/song/directives.test.ts`.

- [ ] **Step 1: Escrever os testes que falham**

Create `lib/song/directives.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  parseDirectives,
  setDirective,
  toggleFormat,
  SCAFFOLD_TRADICIONAL,
  SCAFFOLD_GRADE,
} from './directives'

const tradFull = `{title: Minha Música}
{artist: Fulano}
{tom: C}
{genero: bossa nova, mpb}
{versao: Songbook}
{capo: 2}
{afinacao: standard}
{bpm: 90}
{youtube: https://youtu.be/abc}
{tipo: tradicional}
[C]Terra em [G]transe`

describe('parseDirectives', () => {
  it('extrai todos os campos de uma cifra tradicional completa', () => {
    const d = parseDirectives(tradFull)
    expect(d).toMatchObject({
      title: 'Minha Música',
      artist: 'Fulano',
      key: 'C',
      genres: ['bossa nova', 'mpb'],
      version: 'Songbook',
      capo: 2,
      tuning: 'standard',
      bpm: 90,
      referenceYoutubeUrl: 'https://youtu.be/abc',
      chordFormat: 'TRADICIONAL',
    })
  })

  it('mapeia {tipo: grade} para chordFormat GRADE', () => {
    const d = parseDirectives('{title: X}\n{tipo: grade}\n| C |')
    expect(d.chordFormat).toBe('GRADE')
  })

  it('diretiva ausente → campo vazio/undefined, sem quebrar', () => {
    const d = parseDirectives('{title: X}\n{artist: Y}\n{tom: C}')
    expect(d.bpm).toBeUndefined()
    expect(d.version).toBeUndefined()
    expect(d.genres).toEqual([])
    expect(d.tuning).toBe('standard')
  })

  it('{genero: a, b} → array', () => {
    expect(parseDirectives('{genero: bossa nova, mpb}').genres).toEqual([
      'bossa nova',
      'mpb',
    ])
  })

  it('capo/bpm inteiros; valor inválido → undefined sem derrubar', () => {
    expect(parseDirectives('{capo: 2}\n{bpm: 90}').capo).toBe(2)
    expect(parseDirectives('{capo: 2}\n{bpm: 90}').bpm).toBe(90)
    const d = parseDirectives('{capo: abc}\n{bpm: xyz}')
    expect(d.capo).toBeUndefined()
    expect(d.bpm).toBeUndefined()
  })

  it('diretiva desconhecida é ignorada na extração e preservada no texto', () => {
    const content = '{foo: bar}\n{title: X}\n[C]oi'
    const d = parseDirectives(content)
    expect(d.title).toBe('X')
    // parseDirectives não altera o texto; a diretiva desconhecida continua lá
    expect(content).toContain('{foo: bar}')
  })
})

describe('setDirective (round-trip)', () => {
  it('reescreve a diretiva existente', () => {
    const c = setDirective(tradFull, 'bpm', '120')
    expect(parseDirectives(c).bpm).toBe(120)
  })

  it('insere a diretiva quando ausente', () => {
    const c = setDirective('[C]oi', 'tom', 'D')
    expect(parseDirectives(c).key).toBe('D')
  })

  it('preserva o resto do conteúdo', () => {
    const c = setDirective(tradFull, 'tom', 'D')
    expect(c).toContain('[C]Terra em [G]transe')
    expect(parseDirectives(c).key).toBe('D')
    expect(parseDirectives(c).title).toBe('Minha Música')
  })
})

describe('toggleFormat', () => {
  it('scaffold intocado → troca o scaffold inteiro', () => {
    expect(toggleFormat(SCAFFOLD_TRADICIONAL, 'GRADE')).toBe(SCAFFOLD_GRADE)
    expect(toggleFormat(SCAFFOLD_GRADE, 'TRADICIONAL')).toBe(SCAFFOLD_TRADICIONAL)
  })

  it('conteúdo editado → só troca {tipo}, preserva o corpo', () => {
    const edited = setDirective(SCAFFOLD_TRADICIONAL, 'title', 'X') + '\n[Am]coisa'
    const toggled = toggleFormat(edited, 'GRADE')
    expect(parseDirectives(toggled).chordFormat).toBe('GRADE')
    expect(toggled).toContain('[Am]coisa')
    expect(parseDirectives(toggled).title).toBe('X')
  })
})
```

- [ ] **Step 2: Rodar para ver falhar**

`<nvm> npx vitest run lib/song/directives.test.ts` → FAIL (Cannot find module './directives').

- [ ] **Step 3: Implementar `lib/song/directives.ts`**

```ts
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
  required?: boolean
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

// Campos que aparecem no painel "Detectado" (o formato é o toggle, não um input).
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
  if (content === pristineOther) {
    return target === 'GRADE' ? SCAFFOLD_GRADE : SCAFFOLD_TRADICIONAL
  }
  return setDirective(content, 'tipo', target === 'GRADE' ? 'grade' : 'tradicional')
}
```

- [ ] **Step 4: Rodar para ver passar**

`<nvm> npx vitest run lib/song/directives.test.ts` → todos verdes. Depois `npx vitest run` (suíte) e `npx tsc --noEmit` limpos. Se algum caso divergir do comportamento real, ajuste a implementação (não enfraqueça o teste).

- [ ] **Step 5: Commit**
```bash
git add lib/song/directives.ts lib/song/directives.test.ts
git commit -m "feat: parser de diretivas do template (parse/set/toggle) + scaffolds, com testes"
```

---

## Task 2: Zod + server actions derivando do chordContent

**Files:** Modify `lib/validations/song.ts`, `lib/validations/song.test.ts`, `app/actions/songs.ts`.

- [ ] **Step 1: Atualizar os testes do Zod**

Substituir o conteúdo de `lib/validations/song.test.ts` por:
```ts
import { describe, expect, it } from 'vitest'
import { SongSchema } from './song'

const valid = {
  title: 'Carta ao Tom 74',
  artist: 'Toquinho',
  key: 'C',
  genres: ['MPB'],
  chordFormat: 'GRADE',
}

describe('SongSchema', () => {
  it('aceita payload mínimo válido e aplica default de tuning', () => {
    const r = SongSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.tuning).toBe('standard')
  })

  it('exige title, artist e key', () => {
    const r = SongSchema.safeParse({ ...valid, title: '', artist: '', key: '' })
    expect(r.success).toBe(false)
    if (!r.success) {
      const f = r.error.flatten().fieldErrors
      expect(f.title).toBeDefined()
      expect(f.artist).toBeDefined()
      expect(f.key).toBeDefined()
    }
  })

  it('rejeita chordFormat inválido', () => {
    expect(SongSchema.safeParse({ ...valid, chordFormat: 'X' }).success).toBe(false)
  })

  it('rejeita referenceYoutubeUrl malformada', () => {
    expect(
      SongSchema.safeParse({ ...valid, referenceYoutubeUrl: 'nao-e-url' }).success,
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar para ver falhar**

`<nvm> npx vitest run lib/validations/song.test.ts` → FAIL (o schema ainda exige `status`, então `valid` sem status falha / e os testes antigos sumiram).

- [ ] **Step 3: Reescrever `lib/validations/song.ts`**
```ts
import { z } from 'zod'

export const CHORD_FORMAT = ['TRADICIONAL', 'GRADE'] as const

export const SongSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  artist: z.string().trim().min(1, 'Artista é obrigatório'),
  key: z.string().trim().min(1, 'Tom é obrigatório'),
  genres: z.array(z.string().trim().min(1)).default([]),
  version: z.string().trim().optional(),
  capo: z.number().int().min(0).max(12).optional(),
  tuning: z.string().trim().min(1).default('standard'),
  bpm: z.number().int().min(20).max(400).optional(),
  referenceYoutubeUrl: z.url('URL inválida').optional(),
  chordFormat: z.enum(CHORD_FORMAT),
})

export type SongInput = z.infer<typeof SongSchema>
```
(Removidos `SONG_STATUS`, `status`, `difficulty`, `chordContent`, `notes` — o schema valida só os metadados derivados; `chordContent` entra direto na action.)

- [ ] **Step 4: Reescrever as actions em `app/actions/songs.ts`**

Substituir o topo (linhas 1–59, os helpers `str`/`num`/`parseSongForm` e `createSong`) e a `updateSong` por:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { SongSchema } from '@/lib/validations/song'
import { parseDirectives } from '@/lib/song/directives'

export type SongFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

export async function createSong(
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  await verifySession()
  const chordContent = String(formData.get('chordContent') ?? '')
  const parsed = SongSchema.safeParse(parseDirectives(chordContent))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const song = await prisma.song.create({
    data: { ...parsed.data, chordContent },
  })
  revalidatePath('/songs')
  redirect(`/songs/${song.id}`)
}

export async function updateSong(
  id: string,
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  await verifySession()
  const chordContent = String(formData.get('chordContent') ?? '')
  const parsed = SongSchema.safeParse(parseDirectives(chordContent))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  await prisma.song.update({
    where: { id },
    data: { ...parsed.data, chordContent },
  })
  revalidatePath('/songs')
  revalidatePath(`/songs/${id}`)
  redirect(`/songs/${id}`)
}
```
Manter a `deleteSong` existente (logo abaixo) intacta.

- [ ] **Step 5: Verificar**

`<nvm> npx vitest run` (song tests verdes) e `npx tsc --noEmit` limpo. `prisma.song.create` sem `status`/`difficulty` compila porque `status` tem `@default` e `difficulty` é opcional no schema atual.

- [ ] **Step 6: Commit**
```bash
git add lib/validations/song.ts lib/validations/song.test.ts app/actions/songs.ts
git commit -m "feat: actions derivam metadados do chordContent (diretivas); Zod sem status/difficulty"
```

---

## Task 3: Editor template-first + páginas + remover SongForm

**Files:** Create `app/songs/song-editor.tsx`; Modify `app/songs/new/page.tsx`, `app/songs/[id]/edit/page.tsx`; Remove `app/songs/song-form.tsx`.

- [ ] **Step 1: Criar `app/songs/song-editor.tsx`**
```tsx
'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  parseDirectives,
  setDirective,
  toggleFormat,
  PANEL_FIELDS,
  SCAFFOLD_TRADICIONAL,
  type ChordFormat,
} from '@/lib/song/directives'
import type { SongFormState } from '@/app/actions/songs'

type Action = (
  state: SongFormState,
  formData: FormData,
) => Promise<SongFormState>

export function SongEditor({
  action,
  initialContent = SCAFFOLD_TRADICIONAL,
  submitLabel = 'Criar',
}: {
  action: Action
  initialContent?: string
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState<SongFormState, FormData>(
    action,
    undefined,
  )
  const [content, setContent] = useState(initialContent)

  const derived = parseDirectives(content)
  const format = derived.chordFormat
  const missingRequired =
    !derived.title.trim() || !derived.artist.trim() || !derived.key.trim()

  const display = (field: (typeof PANEL_FIELDS)[number]['field']) => {
    const v = derived[field]
    if (Array.isArray(v)) return v.join(', ')
    return v == null ? '' : String(v)
  }

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit rounded-md border p-1">
          {(['TRADICIONAL', 'GRADE'] as ChordFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setContent((c) => toggleFormat(c, f))}
              className={`rounded px-3 py-1 text-sm ${
                format === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {f === 'TRADICIONAL' ? 'Tradicional' : 'Grade'}
            </button>
          ))}
        </div>
        <Textarea
          name="chordContent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={22}
          spellCheck={false}
          className="font-mono text-sm"
        />
      </div>

      <aside className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Detectado</h2>
        {PANEL_FIELDS.map((d) => {
          const value = display(d.field)
          const filled = value.trim() !== ''
          if (filled) {
            return (
              <div key={d.key} className="text-sm">
                <span className="text-muted-foreground">{d.label}: </span>
                <span className="font-medium">{value}</span>
              </div>
            )
          }
          return (
            <div key={d.key} className="flex flex-col gap-1">
              <label
                htmlFor={`f-${d.key}`}
                className="text-xs text-muted-foreground"
              >
                {d.label}
                {d.required && <span className="text-red-600"> *</span>}
              </label>
              <Input
                id={`f-${d.key}`}
                defaultValue=""
                aria-invalid={d.required || undefined}
                className={d.required ? 'border-red-500' : undefined}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v) setContent((c) => setDirective(c, d.key, v))
                }}
              />
            </div>
          )
        })}
        {state?.errors && (
          <p className="text-sm text-red-600">
            {Object.values(state.errors).flat()[0]}
          </p>
        )}
        <Button type="submit" disabled={pending || missingRequired}>
          {pending ? 'Salvando…' : submitLabel}
        </Button>
      </aside>
    </form>
  )
}
```
Notas: painel derivado de `parseDirectives(content)` (estado derivado, sem estado paralelo). Campo preenchido → chip; ausente → input que **grava no blur** via `setDirective` (evita desmontar o input no meio da digitação). Todos os `setContent` usam updater funcional (`(c) => …`) p/ não perder edições concorrentes da textarea. Obrigatório faltando bloqueia o submit.

- [ ] **Step 2: `app/songs/new/page.tsx`** — trocar o uso de `SongForm` por `SongEditor`:
  - Import: `import { SongEditor } from '@/app/songs/song-editor'`
  - Corpo: `<SongEditor action={createSong} submitLabel="Criar" />`
  (remover o import de `SongForm`.)

- [ ] **Step 3: `app/songs/[id]/edit/page.tsx`** — idem:
  - Import: `import { SongEditor } from '@/app/songs/song-editor'`
  - Corpo: `<SongEditor action={updateSong.bind(null, song.id)} initialContent={song.chordContent} submitLabel="Salvar alterações" />`
  (remover o import de `SongForm`; manter o resto — `verifySession`, `notFound`, o link de voltar.)

- [ ] **Step 4: Remover o form antigo**
```bash
git rm app/songs/song-form.tsx
```

- [ ] **Step 5: Verificar** — `<nvm> npx tsc --noEmit` limpo; `npx vitest run` 27+ verdes; `npx next build` sucesso.

- [ ] **Step 6: Commit**
```bash
git add app/songs/song-editor.tsx app/songs/new/page.tsx "app/songs/[id]/edit/page.tsx"
git commit -m "feat: editor template-first (SongEditor) em criar/editar; remove SongForm"
```

---

## Task 4: Limpeza de status/difficulty na lista e no detalhe

**Files:** Modify `app/songs/page.tsx`, `app/songs/[id]/page.tsx`.

- [ ] **Step 1: Lista** — em `app/songs/page.tsx`, trocar o chip de status pelo tom. Localizar:
```tsx
                <span className="text-sm text-muted-foreground">{s.status}</span>
```
e trocar por:
```tsx
                <span className="text-sm text-muted-foreground">{s.key}</span>
```

- [ ] **Step 2: Detalhe** — em `app/songs/[id]/page.tsx`, remover as duas linhas:
```tsx
        <Meta label="Status" value={song.status} />
```
e
```tsx
        {song.difficulty != null && <Meta label="Dificuldade" value={String(song.difficulty)} />}
```
(Manter as demais Meta: Tom, Formato, Afinação, Capo, BPM, Versão, Gêneros.)

- [ ] **Step 3: Verificar** — `<nvm> npx tsc --noEmit` limpo (nada mais lê `song.status`/`song.difficulty`); `npx next build` sucesso. Confirmar com:
`grep -rnE "\.status|\.difficulty" app/ | grep -v node_modules` → sem ocorrências de `song.status`/`song.difficulty`.

- [ ] **Step 4: Commit**
```bash
git add app/songs/page.tsx "app/songs/[id]/page.tsx"
git commit -m "refactor: remove status/difficulty da lista e do detalhe; lista mostra o tom"
```

---

## Task 5: Migration do schema (drop status/difficulty, add comoEstouTocando)

**Files:** Modify `prisma/schema.prisma`.

> Pré-condição: Tasks 2–4 já removeram todas as referências a `status`/`difficulty` no código.

- [ ] **Step 1: Editar `prisma/schema.prisma`** no `model Song`:
  - Remover a linha `difficulty          Int?`
  - Remover a linha `status              SongStatus  @default(APRENDENDO)`
  - Adicionar `comoEstouTocando    Int?`
  - Remover o bloco `enum SongStatus { ... }` inteiro.

- [ ] **Step 2: Rodar a migration**
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npx prisma migrate dev --name remove_status_difficulty_add_comoestoutocando
```
Expected: cria a migration, aplica no Neon (drop de 2 colunas + enum, add de 1 coluna), regenera o client. Sem dados reais → sem perda relevante. Se pedir confirmação de perda de dados, prosseguir (não há dados a preservar). Se falhar por outro motivo, reportar o erro exato.

- [ ] **Step 3: Verificar** — `<nvm> npx tsc --noEmit` limpo (o tipo `Song` agora sem `status`/`difficulty`; nada referencia → verde); `npx vitest run` verdes; `npx next build` sucesso.

- [ ] **Step 4: Commit**
```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: schema — remove status/difficulty, adiciona comoEstouTocando (migration)"
```

---

## Task 6: Materializar SPEC.md (§5, §6) — coordenador

**Files:** Create `SPEC.md`.

> Feito pelo coordenador (tem o texto da spec original do projeto em contexto), não por subagente.
> Materializar `SPEC.md` com as seções do projeto, com **§5 (schema)** refletindo o novo `model Song`
> (sem `difficulty`/`status`/enum; com `comoEstouTocando Int?`) e **§6 (diretivas)** com o mapa
> diretiva→campo (tabela da spec de mudança) + os scaffolds Tradicional/Grade. Commit:
> `docs: materializa SPEC.md com §5/§6 atualizados (schema + diretivas)`.

---

## Task 7: Verificação E2E manual — coordenador

- [ ] `npx vitest run` (todos verdes), `npx next build` (sucesso).
- [ ] Subir dev; seed/registro via UI ou HTTP:
  - `/songs/new` carrega com o scaffold Tradicional; toggle Grade troca o scaffold; digitar preserva.
  - Colar um scaffold preenchido → painel "Detectado" mostra os campos; obrigatório faltando bloqueia Criar.
  - Criar → Song persistida com `chordContent` cru **intacto** e campos derivados corretos (conferir no Neon).
  - Editar uma música → editor pré-carrega o `chordContent`; salvar altera; detalhe reflete.
  - Editar um campo no painel (blur) → a diretiva correspondente é reescrita no texto.
  - Lista mostra o tom; detalhe sem Status/Dificuldade.

---

## Self-Review (autor)

**Cobertura do spec (2026-07-02-nova-musica-template-first-design.md):**
- §3 schema (remove difficulty/status, add comoEstouTocando, migration) → Task 5. ✅
- §4 parser puro (parseDirectives/setDirective) → Task 1. ✅
- §5 scaffolds + toggleFormat → Task 1. ✅
- §6 editor template-first (painel derivado, round-trip, toggle, bloqueio de obrigatório) → Task 3. ✅
- §7 actions derivando do content → Task 2. ✅
- §8 Zod + limpeza lista/detalhe → Tasks 2, 4. ✅
- §9 testes TDD (todos os critérios de aceite) → Task 1 (+ Zod na 2); integração/persistência = E2E manual (Task 7). ✅
- §10 SPEC.md §5/§6 → Task 6. ✅

**Placeholders:** nenhum — todo passo tem código/comando. ✅

**Consistência de tipos:** `DerivedFields`/`ChordFormat`/`parseDirectives`/`setDirective`/`toggleFormat`/`PANEL_FIELDS`/`SCAFFOLD_*` definidos na Task 1 e usados na 2 (actions) e 3 (editor). `SongSchema` (Task 2) valida exatamente `DerivedFields`. `SongFormState` (Task 2) usado pelo `SongEditor` (Task 3). `updateSong(id,…)` + `.bind(null,id)` na edit page. ✅

**Ordem mantém tsc verde:** parser (1) → actions param de escrever status/difficulty (2) → editor/páginas (3) → lista/detalhe param de ler (4) → migration dropa (5). Cada commit compila. ✅

**Riscos:** (1) migration destrutiva — sem dados, ok; se `migrate dev` exigir input interativo, reportar. (2) round-trip de campo numérico no editor: input do painel grava string crua via `setDirective` no blur; `parseDirectives` re-parseia (inválido→undefined) sem limpar o texto digitado. (3) toggle de formato: comparação exata com scaffold intocado; senão preserva o corpo.
