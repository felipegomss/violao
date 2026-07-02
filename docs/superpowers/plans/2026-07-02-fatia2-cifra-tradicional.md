# Fatia 2 — Cifra tradicional (parse ChordPro + render) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renderizar `chordContent` de músicas no formato TRADICIONAL (ChordPro) como cifra estruturada acorde-sobre-letra na página de detalhe, com cada acorde como elemento próprio (base pro toggle de grau da fatia 4 e diagramas da fatia 8).

**Architecture:** Parser puro/testável (`lib/chordsheet/parse.ts`) usa ChordSheetJS e produz um view model próprio, desacoplado da lib. Um componente de render "burro" (`chord-sheet.tsx`) desenha o view model. Um componente `Cifra` faz o branch por formato (TRADICIONAL → render; GRADE → `<pre>` cru; erro/vazio → fallback) e entra na página de detalhe.

**Tech Stack:** Next.js 16 App Router (Server Components), React 19, TypeScript, ChordSheetJS 15.5.2, vitest, Tailwind v4.

---

## Convenções

- **Node via nvm.** Prefixe todo comando node/npm/npx com:
  `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null`
- Trabalhe da raiz do worktree. Alias `@/*` → raiz. Sem `src/`.
- `chordsheetjs@^15.5.2` **já está instalado e commitado** (commit `23cf873`) — não reinstalar.
- Base: fatia 1 no ar. `app/songs/[id]/page.tsx` já existe e mostra a cifra num `<pre>`.

## API do ChordSheetJS (confirmada em runtime — não chutar)

- `new ChordSheetJS.ChordProParser().parse(content)` → `Song`.
- `Song.lines: Line[]`. `Line.items: Item[]`, `Line.type: string`, `Line.isEmpty(): boolean`.
- `Item` pode ser `ChordLyricsPair | Tag | Comment | ...`. Checar com `instanceof`.
- `ChordLyricsPair.chords: string` (`''` quando não há acorde), `.lyrics: string | null`.
- `Tag`: `.name: string` (nome completo; `{c}`→`comment`), `.value: string`, `.label: string`,
  `.isMetaTag(): boolean` (`{title}`/`{artist}`/…), `.isSectionStart(): boolean`.
- **Comportamento observado:** `{title}`/`{artist}` → Tag com `isMetaTag()===true`. `{comment: X}` →
  Tag `name==='comment'`, `value==='X'`. `{start_of_verse: Verso 1}` → Tag `isSectionStart()===true`,
  `label==='Verso 1'`. `{end_of_verse}` → Tag section com `label===''`. Acordes BR (`F#m7(5-)`) e
  baixo (`G/B`) ficam **verbatim** em `.chords`.
- **Import (verificado em runtime):** `import ChordSheetJS from 'chordsheetjs'` e desestruturar
  (`const { ChordProParser, ChordLyricsPair, Tag } = ChordSheetJS`). `esModuleInterop` já está ligado.

## Mapa de arquivos

**Criar:**
- `lib/chordsheet/parse.ts` — `parseChordSheet(content) → ChordSheet` (view model) + os tipos.
- `lib/chordsheet/parse.test.ts` — testes do parser.
- `app/songs/[id]/chord-sheet.tsx` — `<ChordSheet sheet={...} />` (render burro).
- `app/songs/[id]/cifra.tsx` — `<Cifra format content />` (branch por formato + fallback).

**Modificar:**
- `app/songs/[id]/page.tsx` — troca o `<pre>` da seção "Cifra" por `<Cifra .../>`.

---

## Task 1: Parser puro `parseChordSheet` (TDD)

**Files:**
- Create: `lib/chordsheet/parse.ts`
- Test: `lib/chordsheet/parse.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Create `lib/chordsheet/parse.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { parseChordSheet } from './parse'

describe('parseChordSheet', () => {
  it('mapeia pares acorde/letra', () => {
    const line = parseChordSheet('[C]Terra em [G]transe').lines[0]
    expect(line.type).toBe('row')
    if (line.type === 'row') {
      expect(line.items[0]).toEqual({ chord: 'C', lyrics: 'Terra ' })
      expect(line.items.some((i) => i.chord === 'G')).toBe(true)
    }
  })

  it('preserva notação BR e baixo invertido verbatim', () => {
    const line = parseChordSheet('[F#m7(5-)]Nota [G/B]baixo').lines[0]
    expect(line.type).toBe('row')
    if (line.type === 'row') {
      expect(line.items[0].chord).toBe('F#m7(5-)')
      expect(line.items[1].chord).toBe('G/B')
    }
  })

  it('linha só de acordes vira row', () => {
    const line = parseChordSheet('[C] [G] [Am]').lines[0]
    expect(line.type).toBe('row')
    if (line.type === 'row') {
      expect(line.items.map((i) => i.chord)).toEqual(['C', 'G', 'Am'])
    }
  })

  it('{comment} vira label', () => {
    const { lines } = parseChordSheet('{comment: Intro}')
    expect(lines[0]).toEqual({ type: 'label', text: 'Intro' })
  })

  it('{start_of_verse: X} vira label com o rótulo da seção', () => {
    const { lines } = parseChordSheet('{start_of_verse: Verso 1}\n[C]oi')
    expect(lines[0]).toEqual({ type: 'label', text: 'Verso 1' })
  })

  it('ignora metadados {title}/{artist}', () => {
    const rows = parseChordSheet('{title: X}\n{artist: Y}\n[C]oi').lines.filter(
      (l) => l.type === 'row',
    )
    expect(rows).toHaveLength(1)
  })

  it('não emite label/row para metadados', () => {
    const meaningful = parseChordSheet('{title: X}').lines.filter(
      (l) => l.type === 'label' || l.type === 'row',
    )
    expect(meaningful).toEqual([])
  })

  it('linha em branco vira empty', () => {
    const { lines } = parseChordSheet('[C]oi\n\n[G]tchau')
    expect(lines.some((l) => l.type === 'empty')).toBe(true)
  })

  it('ignora fim de seção sem label', () => {
    const meaningful = parseChordSheet('{end_of_verse}').lines.filter(
      (l) => l.type === 'label' || l.type === 'row',
    )
    expect(meaningful).toEqual([])
  })
})
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null; npx vitest run lib/chordsheet/parse.test.ts`
Expected: FAIL — `Cannot find module './parse'`.

- [ ] **Step 3: Implementar o parser**

Create `lib/chordsheet/parse.ts`:
```ts
import ChordSheetJS from 'chordsheetjs'

const { ChordProParser, ChordLyricsPair, Tag } = ChordSheetJS

export type ChordSheetItem = { chord: string | null; lyrics: string }
export type ChordSheetLine =
  | { type: 'row'; items: ChordSheetItem[] }
  | { type: 'label'; text: string }
  | { type: 'empty' }
export type ChordSheet = { lines: ChordSheetLine[] }

export function parseChordSheet(content: string): ChordSheet {
  const song = new ChordProParser().parse(content)
  const lines: ChordSheetLine[] = []

  for (const line of song.lines) {
    if (line.isEmpty()) {
      lines.push({ type: 'empty' })
      continue
    }

    const items: ChordSheetItem[] = []
    let label: string | null = null

    for (const item of line.items) {
      if (item instanceof ChordLyricsPair) {
        const chord = item.chords ? item.chords : null
        const lyrics = item.lyrics ?? ''
        if (chord === null && lyrics === '') continue
        items.push({ chord, lyrics })
      } else if (item instanceof Tag) {
        if (item.isMetaTag()) continue // {title}/{artist}/... → ignora
        if (item.name === 'comment') {
          label = item.value
        } else if (item.isSectionStart() && item.label) {
          label = item.label
        }
        // demais tags (fim de seção, etc.) → ignora
      }
      // outros tipos de item não aparecem em ChordPro normal → ignora
    }

    if (items.length > 0) {
      lines.push({ type: 'row', items })
    } else if (label) {
      lines.push({ type: 'label', text: label })
    }
    // senão (só metadado / fim de seção) → não emite nada
  }

  return { lines }
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `<nvm> npx vitest run lib/chordsheet/parse.test.ts`
Expected: PASS (8 testes). Depois `npx vitest run` (suíte inteira) → 13 + 8 = 21 verdes.

Se algum teste falhar por quirk do parser (ex.: linha vazia extra no fim), **não enfraqueça o teste** — ajuste a lógica do parser/asserção para refletir o comportamento real observado, mantendo a intenção (BR verbatim, meta ignorado, comment/section → label, blank → empty).

- [ ] **Step 5: Commit**

```bash
git add lib/chordsheet/parse.ts lib/chordsheet/parse.test.ts
git commit -m "feat: parseChordSheet — ChordPro -> view model (fatia 2) com testes"
```

---

## Task 2: Componente de render `ChordSheet` (burro)

**Files:**
- Create: `app/songs/[id]/chord-sheet.tsx`

- [ ] **Step 1: Implementar o componente**

Create `app/songs/[id]/chord-sheet.tsx`:
```tsx
import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'

export function ChordSheet({ sheet }: { sheet: ChordSheetModel }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-muted p-4">
      {sheet.lines.map((line, i) => {
        if (line.type === 'empty') {
          return <div key={i} className="h-4" aria-hidden />
        }
        if (line.type === 'label') {
          return (
            <div
              key={i}
              className="mt-4 mb-1 text-sm font-semibold text-muted-foreground first:mt-0"
            >
              {line.text}
            </div>
          )
        }
        return (
          <div key={i} className="flex font-mono text-sm leading-tight">
            {line.items.map((item, j) => (
              <span key={j} className="flex flex-col">
                <span className="h-5 whitespace-pre font-semibold text-primary">
                  {item.chord ?? ''}
                </span>
                <span className="whitespace-pre">{item.lyrics}</span>
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
```
Notas: cada par é uma coluna (acorde em cima com altura fixa `h-5` p/ alinhar as letras; letra embaixo). `whitespace-pre` preserva espaços. A linha é `flex` sem wrap; o container tem `overflow-x-auto` para cifras largas rolarem em vez de estourar o layout.

- [ ] **Step 2: Verificar tipos**

Run: `<nvm> npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/songs/[id]/chord-sheet.tsx
git commit -m "feat: componente ChordSheet (render acorde-sobre-letra)"
```

---

## Task 3: Componente `Cifra` (branch por formato) + integração

**Files:**
- Create: `app/songs/[id]/cifra.tsx`
- Modify: `app/songs/[id]/page.tsx`

- [ ] **Step 1: Componente Cifra com branch + fallback**

Create `app/songs/[id]/cifra.tsx`:
```tsx
import { parseChordSheet } from '@/lib/chordsheet/parse'
import { ChordSheet } from './chord-sheet'

const PRE = 'overflow-x-auto rounded-md border bg-muted p-4 font-mono text-sm'

export function Cifra({ format, content }: { format: string; content: string }) {
  if (!content.trim()) {
    return <pre className={PRE}>(vazio)</pre>
  }

  if (format === 'TRADICIONAL') {
    try {
      return <ChordSheet sheet={parseChordSheet(content)} />
    } catch {
      return (
        <>
          <p className="mb-2 text-sm text-muted-foreground">
            Não foi possível formatar a cifra; exibindo texto cru.
          </p>
          <pre className={PRE}>{content}</pre>
        </>
      )
    }
  }

  // GRADE (e qualquer outro) → texto cru; a fatia 3 troca isto.
  return <pre className={PRE}>{content}</pre>
}
```

- [ ] **Step 2: Integrar na página de detalhe**

Modify `app/songs/[id]/page.tsx`:
- Adicionar o import (junto aos outros imports do topo): `import { Cifra } from './cifra'`
- Substituir a seção da cifra. Trocar este bloco:
  ```tsx
      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">Cifra</h2>
        <pre className="overflow-x-auto rounded-md border bg-muted p-4 font-mono text-sm">
          {song.chordContent || '(vazio)'}
        </pre>
      </section>
  ```
  por:
  ```tsx
      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">Cifra</h2>
        <Cifra format={song.chordFormat} content={song.chordContent} />
      </section>
  ```

- [ ] **Step 3: Verificar tipos e build**

Run:
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npx tsc --noEmit
npx vitest run
npx next build
```
Expected: tsc limpo; vitest 21/21; `next build` sucesso (aviso benigno de lockfile OK). O parser roda em Server Component (Node) — confirmar que o build não reclama do `chordsheetjs`.

- [ ] **Step 4: Commit**

```bash
git add app/songs/[id]/cifra.tsx app/songs/[id]/page.tsx
git commit -m "feat: render de cifra tradicional na página de detalhe (branch por formato)"
```

- [ ] **Step 5: Verificação manual (coordenador)**

O coordenador (não o subagente) valida via HTTP/browser contra o Neon:
- Criar/seed uma música **TRADICIONAL** com ChordPro (ex.: `{comment: Intro}` + `[C]Terra em [G]transe...` + `[F#m7(5-)]...`) → detalhe mostra acorde-sobre-letra alinhado, notação BR intacta, label "Intro".
- Uma música **GRADE** continua em `<pre>` cru.
- ChordContent malformado → cai no fallback com aviso, sem quebrar a página.
- Cifra larga rola horizontalmente sem estourar o layout.

---

## Self-Review (autor)

**Cobertura do spec (2026-07-02-fatia2-cifra-tradicional-design.md):**
- §2/§4.1 parser puro + view model → Task 1. ✅
- §4.2 componente de render burro → Task 2. ✅
- §5 integração na página + branch por formato + fallback → Task 3. ✅
- §6 estilo acorde-sobre-letra, overflow-x-auto → Task 2 (ChordSheet). ✅
- §7 testes TDD (BR verbatim, comment/section→label, meta ignorado, blank→empty, só-acorde) → Task 1. ✅
- §8 dependência chordsheetjs → já instalada/commitada (`23cf873`). ✅
- Fora de escopo (GRADE render, toggle, player, diagramas, preview) → respeitado (GRADE segue `<pre>`). ✅

**Placeholders:** nenhum — todo passo tem código/comando completo. ✅

**Consistência de tipos:** `ChordSheet`/`ChordSheetItem`/`ChordSheetLine` definidos na Task 1 e usados na 2 (importado como `ChordSheetModel` p/ não colidir com o componente `ChordSheet`). `parseChordSheet` (Task 1) usado na Task 3. `Cifra` (Task 3) recebe `format: string`/`content: string`, compatível com `song.chordFormat`/`song.chordContent` do Prisma. ✅

**Riscos:**
1. Import do chordsheetjs: usar `import ChordSheetJS from 'chordsheetjs'` + destructure (verificado em runtime). Se o `tsc` reclamar do default import, o `esModuleInterop` já está ligado — deve tipar como namespace.
2. Quirk do parser (linha vazia extra, etc.): os testes usam `filter`/`some` onde há risco, em vez de igualdade de array inteiro. Ajustar a lógica (não os testes) se aparecer divergência.
3. `chordsheetjs` em Server Component: é lib JS pura de parsing, roda em Node; confirmar no `next build` (Task 3 Step 3).
