# Redesign "Caderno" — Plano de Execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** tirar o "ar de AI made" das telas do Compasso instalando um sistema de design real (escala tipográfica, espaçamento, botões, motion) e reconstruindo a tela da cifra no padrão consagrado do ramo, mantendo a identidade editorial "caderno de música".

**Architecture:** a direção estética atual (papel/folha/ink/teal/rust, Newsreader + JetBrains Mono) fica. O que muda é a execução: tokens e regras substituem valores arbitrários; a cifra vira "página de livro" com régua de estudo fixa; listas viram índice de songbook. Nada de troca de framework: Tailwind v4 `@theme` + componentes existentes refinados.

**Tech Stack:** Next 16, Tailwind v4, lucide-react, componentes existentes (`EditorialCifra`, `CifraStudy`, `StagePalco`, `ChordDiagram`, `Acervo`, etc.).

---

## Parte A — Diagnóstico (por que parece IA)

| # | Tell | Onde |
|---|------|------|
| 1 | Eyebrow-itis: mono-caps + tracking em TUDO (labels, botões, chips, seções) | todas as telas |
| 2 | 25+ tamanhos de fonte arbitrários (`text-[8px]`…`text-[52px]`), sem escala; texto de 8–10px | todas |
| 3 | Tudo é caixinha `border-ink/22 rounded-md`; sem hierarquia primário/secundário; cor de botão aleatória (teal/ink/gold) | todas |
| 4 | Espaçamento fora da grade 8px (`p-[18px]`, `py-[15px]`) | todas |
| 5 | Right rail da cifra é um formulário de settings com player morto no topo | cifra |
| 6 | Acorde (12px) MENOR que a letra (15px) — o ramo inteiro faz o oposto | cifra |
| 7 | Header da cifra: breadcrumb duplica título; tom/capo como chips-formulário | cifra |
| 8 | Zero motion — nada respira | todas |
| 9 | Gimmick isolado: sombra dupla nos cards de repertório | repertórios |
| 10 | Empty states = parágrafo itálico, sem ilustração nem ação | acervo, repertórios |
| 11 | Resíduos: `▾`/`‹` unicode, rating com 3 larguras, rust com papel triplo | várias |
| 12 | A11y: alvos <44px, textos <12px, focus não verificado | todas |

## Parte B — Padrões do ramo que vamos adotar (da pesquisa CifraClub/UG/Chordify/Letras)

1. **Metadado = controle**: `TOM: G` clicável abre transposição; "restaurar tom" aparece quando transposto.
2. **Acorde dominante**: mono **bold**, cor de marca, ≥ tamanho da letra, clicável → diagrama.
3. **Linha de diagramas** dos acordes usados na música, no topo da folha (pin chords).
4. **Régua de estudo única** (o ponto fraco de TODOS eles — controles espalhados): barra fixa com transpor · notação · A−/A+ · auto-scroll · metrônomo · palco.
5. **Labels de seção** `[Intro]`/`[Refrão]` visíveis (rust, borda-esq), tab ASCII embutida.
6. **Lista ranqueada**: ordinal mono grande + título + artista + tom na linha.
7. **Modo palco** de 1º nível (já temos; refinar).
8. **A oportunidade**: eles são poluídos e utilitários — nossa folha é "página de livro": margens generosas, zero ruído, tipografia editorial de songbook.

## Parte C — O Sistema (regras que matam o "ar de IA")

### C.1 Escala tipográfica (única fonte de tamanhos permitidos)

| Token | Valor | Uso |
|---|---|---|
| `display` | 40px serif 600 | título da música na folha |
| `h1` | 32px serif 600 | título de página (Acervo, Repertórios) |
| `h2` | 24px serif 600 | cards, títulos de item |
| `h3` | 19px serif 500 | subtítulos, artista |
| `body` | 16px serif 400 | prosa, empty states |
| `small` | 14px serif 400 | secundário |
| `caption` | 12px | mínimo absoluto de texto legível |
| `mono-ui` | 13px mono | valores, tom, controles |
| `mono-label` | 11px mono lowercase | labels de controle (SEM caps, SEM tracking largo) |
| `eyebrow` | 11px mono caps tracking .18em | **máximo 1 por tela** |

**Regras:** letra da cifra 16px mono / acordes 16px mono **700** teal. Nada abaixo de 11px. Caps+tracking só no eyebrow.

### C.2 Espaçamento
Grade 8px: `8 / 16 / 24 / 32 / 48 / 64`. 4px só pra ajuste ótico (gap ícone-label). Padding de seção: 24px; de página: 32–40px. Morrem: `p-[18px]`, `py-[15px]`, `px-[13px]`.

### C.3 Botões (3 níveis + danger, radius concêntrico)
- **Primary**: `bg-teal text-folha` 44px alt, radius 8px, mono 13px lowercase, hover escurece 6%.
- **Secondary**: `border border-ink/25 text-ink` mesmo tamanho; hover `bg-folha`.
- **Ghost**: texto teal sem borda, underline no hover.
- **Danger**: rust — e rust SÓ significa perigo/seção; estados ativos usam teal.
- Ícone-only: 44×44 com `aria-label`. Foco: `focus-visible:outline-2 outline-teal outline-offset-2`.

### C.4 Motion (orçamento)
- Hovers/estados: 150ms ease-out (cor, borda, sombra).
- Entrada de lista: stagger 40ms, máx 6 itens, translateY(4px)+fade 200ms.
- Overlay/palco: 250ms ease-in-out.
- `prefers-reduced-motion`: tudo vira instantâneo.

---

## FASE 0 — Fundação (tokens + primitivos)

### Task 0.1: Tokens de tipografia/spacing/motion no globals.css

**Files:** Modify: `app/globals.css`

- [ ] **Step 1:** Adicionar ao `@theme inline` (bloco DS editorial):

```css
  /* Escala tipográfica do Caderno */
  --text-display: 2.5rem;   /* 40px */
  --text-h1: 2rem;          /* 32px */
  --text-h2: 1.5rem;        /* 24px */
  --text-h3: 1.1875rem;     /* 19px */
  --text-body: 1rem;        /* 16px */
  --text-small: 0.875rem;   /* 14px */
  --text-caption: 0.75rem;  /* 12px */
  --text-mono-ui: 0.8125rem;   /* 13px */
  --text-mono-label: 0.6875rem;/* 11px */
  /* Motion */
  --ease-out-soft: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --dur-fast: 150ms;
  --dur-med: 250ms;
```

- [ ] **Step 2:** Adicionar utilities de conveniência em `@layer base`:

```css
@layer base {
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

- [ ] **Step 3:** `npx tsc --noEmit && npx next build` verdes. Commit: `feat(ds): escala tipográfica, motion tokens e reduced-motion`

### Task 0.2: Componente de botão do Caderno

**Files:** Create: `components/btn.tsx`

- [ ] **Step 1:** Criar o componente (variants primary/secondary/ghost/danger, tamanho padrão 44px e `sm` 36px):

```tsx
import type { ComponentProps } from 'react'

const VARIANTS = {
  primary:
    'bg-teal text-folha hover:bg-[#16323f] border border-transparent',
  secondary:
    'border border-ink/25 text-ink hover:bg-folha',
  ghost:
    'text-teal hover:underline underline-offset-4 border border-transparent',
  danger:
    'border border-rust/40 text-rust hover:bg-rust/5',
} as const

const SIZES = {
  md: 'h-11 px-5 text-[13px]',
  sm: 'h-9 px-4 text-[12px]',
} as const

export function Btn({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<'button'> & {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-cifra lowercase tracking-[.02em] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  )
}
```

- [ ] **Step 2:** Build verde. Commit: `feat(ds): componente Btn (primary/secondary/ghost/danger)`

---

## FASE 1 — Cifra, a tela âncora

### Task 1.1: Acordes dominantes + respiro na cifra

**Files:** Modify: `app/songs/[id]/editorial-cifra.tsx`

- [ ] **Step 1:** Acordes: `text-[12px] font-medium` → `text-[16px] font-bold` (h-[15px] → h-[22px]); letra: `text-[15px] leading-[1.5]` → `text-[16px] leading-[1.9]`. Acorde-badge (linha só de acordes): subir pra 14px.
- [ ] **Step 2:** Labels de seção: de `text-[10px] dotted underline` para bloco com borda-esquerda 2px rust, mono 12px caps tracking .08em, `mt-8 mb-3`, padding-left 10px.
- [ ] **Step 3:** Espaço entre blocos (empty line): `h-3` → `h-5`.
- [ ] **Step 4:** Conferir no navegador com uma cifra real (acordes alinhados, respiro). Commit: `feat(cifra): acordes dominantes e ritmo editorial na folha`

### Task 1.2: Header da folha (metadado = controle)

**Files:** Modify: `app/songs/[id]/page.tsx`, `app/songs/[id]/cifra-study.tsx`

- [ ] **Step 1:** Remover o breadcrumb "acervo → título" (o back fica na sidebar/topo). Título `text-display` (40px), artista `h3` itálico teal.
- [ ] **Step 2:** Trocar os MetaChips-formulário por uma **linha de metadados** mono 13px: `tom G · capo 2ª · E A D G B E · v. Toquinho`, onde **tom** é `<button>` que abre o stepper de transposição (mover o controle de transpor do rail pra cá) e mostra `tom G → A · restaurar` quando transposto.
- [ ] **Step 3:** Ações (palco, ⋯) alinhadas à direita do header usando `Btn`.
- [ ] **Step 4:** Build + conferir. Commit: `feat(cifra): header editorial com metadado-controle (tom clicável)`

### Task 1.3: Linha de diagramas (pin chords)

**Files:** Create: `app/songs/[id]/chord-strip.tsx` · Modify: `app/songs/[id]/cifra-study.tsx`

- [ ] **Step 1:** Extrair acordes únicos do sheet (ordem de aparição, já transpostos), resolver `chordDiagram(token)` e renderizar `ChordDiagram` compacto (~64px) em linha com scroll-x, entre o header e a cifra:

```tsx
const uniqueChords = useMemo(() => {
  if (!sheet) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of sheet.lines) {
    if (line.type !== 'row') continue
    for (const it of line.items) {
      if (it.chord && !seen.has(it.chord)) {
        seen.add(it.chord)
        out.push(it.chord)
      }
    }
  }
  return out
}, [sheet])
```

- [ ] **Step 2:** `ChordDiagram` ganha prop `compact` (menor, sem nome gigante). Acorde sem shape não renderiza.
- [ ] **Step 3:** Hover no acorde da cifra continua abrindo o popover (mantém). Commit: `feat(cifra): linha de diagramas dos acordes da música`

### Task 1.4: Régua de estudo (mata o right rail formulário)

**Files:** Create: `app/songs/[id]/study-bar.tsx` · Modify: `app/songs/[id]/cifra-study.tsx`

- [ ] **Step 1:** Criar a régua: barra flutuante fixa no rodapé (desktop: centrada, `bottom-6`, pill folha com sombra 2; mobile: full-width bottom, alvos 44px), contendo, nesta ordem: **transpor** (− tom +), **notação** (acorde/grau), **A− A+** (tamanho da letra da cifra, novo estado `fontScale` 0.875/1/1.125), **auto-scroll** (play/pause + vel − +), **metrônomo** (quando bpm), **palco**.
- [ ] **Step 2:** O conteúdo da folha passa a coluna única centrada `max-w-[760px]`. O right rail some. O **player YouTube** (quando houver vídeo) vira um bloco colapsável ancorado abaixo do header (`<details>` estilizado ou estado), nunca um placeholder morto quando não há vídeo.
- [ ] **Step 3:** "Como estou tocando" muda pro fim da folha (depois da cifra, antes das anotações), como linha editorial: label mono + 5 segmentos + palavra.
- [ ] **Step 4:** Teclado: `space` alterna auto-scroll quando a régua está montada (sem roubar de inputs).
- [ ] **Step 5:** Build + teste manual completo dos controles. Commit: `feat(cifra): régua de estudo fixa; folha em coluna única`

### Task 1.5: Palco alinhado à régua

**Files:** Modify: `app/songs/[id]/stage-palco.tsx`

- [ ] **Step 1:** Acordes do palco: manter gold, subir letra pra 22px lh-1.8; labels de seção com a mesma borda-esq (gold/40).
- [ ] **Step 2:** Controles do palco reorganizados na mesma ordem/ícones da régua (consistência), alvos ≥44px.
- [ ] **Step 3:** Entrada/saída do overlay com fade+scale 250ms (respeitando reduced-motion). Commit: `feat(palco): consistência com a régua + transição`

---

## FASE 2 — Acervo como índice de songbook

### Task 2.1: Linhas do índice

**Files:** Modify: `app/songs/acervo.tsx`

- [ ] **Step 1:** Linha: ordinal mono 13px faint → título serif 19px/600 + artista serif itálico 14px soft → direita: **tom** como texto mono 13px teal (sem caixa), rating compacto (5 segmentos 16×6px, um só lugar/estilo), gênero vira texto mono 11px faint (sem badge).
- [ ] **Step 2:** Separador: filete pontilhado `border-dotted border-ink/15`; hover: `bg-folha` + transição 150ms; altura da linha ~64px.
- [ ] **Step 3:** Cabeçalho de colunas some (a linha é autoexplicativa); contagem "N de M músicas" vira o único eyebrow da tela.
- [ ] **Step 4:** Filtros: gênero/artista/ordem viram texto-links mono 12px com underline no ativo (sem caixinhas); dropdowns mantêm popover atual mas com `Btn` ghost. Commit: `feat(acervo): índice de songbook (linhas editoriais, tom como texto)`

### Task 2.2: Busca protagonista + stagger

**Files:** Modify: `app/songs/acervo.tsx`

- [ ] **Step 1:** Busca: serif 20px mantida, mas com o ícone alinhado e `caret-teal`; margem 32px acima/abaixo.
- [ ] **Step 2:** Entrada da lista com stagger (40ms, máx 6): classe utilitária com `animation-delay` inline. Commit: `feat(acervo): busca protagonista + entrada suave`

### Task 2.3: Empty states com a marca

**Files:** Modify: `app/songs/acervo.tsx`, `app/repertorios/page.tsx`, `app/repertorios/[id]/repertorio-detalhe.tsx`

- [ ] **Step 1:** Empty state padrão: `<Semibreve size={40} className="text-ink/20" />` sobre 5 linhas de pauta (reuso do padrão do wordmark), título serif 19px, frase atual, e `Btn` primary com a ação ("Adicionar música" / "Criar repertório").
- [ ] **Step 2:** Commit: `feat(ui): empty states ilustrados com a semibreve`

---

## FASE 3 — Repertórios

### Task 3.1: Cards sem gimmick

**Files:** Modify: `app/repertorios/page.tsx`

- [ ] **Step 1:** Card: remover sombra dupla e translate; usar `border border-ink/16 rounded-xl` + sombra 1 no hover (150ms) + **lombada**: barra 4px teal à esquerda (metáfora de caderno). Contagem vira mono 12px teal (sem pílula ink). "abrir pasta →" some (o card inteiro é o link; cursor + hover bastam).
- [ ] **Step 2:** Commit: `feat(repertorios): cards com lombada, sem sombra dupla`

### Task 3.2: Detalhe alinhado ao índice

**Files:** Modify: `app/repertorios/[id]/repertorio-detalhe.tsx`

- [ ] **Step 1:** Linhas iguais às do acervo (Task 2.1); drag handle e ✕ com alvos 44px; header usa `Btn`.
- [ ] **Step 2:** Commit: `feat(repertorios): detalhe alinhado ao índice`

---

## FASE 4 — Editor + Login polish

### Task 4.1: Editor

**Files:** Modify: `app/songs/song-editor.tsx`

- [ ] **Step 1:** `‹` vira `ChevronLeft`; título `h1`; painel Detectado: labels mono-label 11px lowercase (sem caps/tracking), inputs com focus teal consistente; botão submit vira `Btn` primary full-width; "N de M campos" é o eyebrow da tela.
- [ ] **Step 2:** Commit: `feat(editor): alinhamento ao sistema`

### Task 4.2: Login

**Files:** Modify: `app/login/login-form.tsx`

- [ ] **Step 1:** Botões viram `Btn` (primary/ghost); h3 usa escala; inputs mantêm underline mas com `focus-visible` e altura ≥44px.
- [ ] **Step 2:** Commit: `feat(login): botões e foco do sistema`

---

## FASE 5 — Pass transversal (caça aos tells)

### Task 5.1: Caça a tamanhos/espaçamentos órfãos

- [ ] **Step 1:** `grep -rn "text-\[([0-9]|10)px\]" app components` → todo texto <11px sobe pra 11/12px (exceto SVG interno de diagrama).
- [ ] **Step 2:** `grep -rn "p-\[18px\]\|py-\[15px\]\|px-\[13px\]" app` → grade 8px (16/24).
- [ ] **Step 3:** `grep -rn "uppercase" app components` → auditar 1 a 1: sobrevive só o eyebrow (1/tela) e labels de seção da cifra; o resto vira lowercase mono-label.
- [ ] **Step 4:** `grep -rn "▾\|‹\|›" app` → lucide (`ChevronDown` etc.).
- [ ] **Step 5:** Commit: `polish(ds): caça a tamanhos, caps e glifos órfãos`

### Task 5.2: A11y + verificação final

- [ ] **Step 1:** Alvos: transpor/steppers/ícone-only ≥44px (px+py ou h-11 w-11).
- [ ] **Step 2:** `focus-visible` visível em TODO interativo (outline teal 2px offset 2).
- [ ] **Step 3:** `npx tsc --noEmit && npx vitest run && npx next build` verdes.
- [ ] **Step 4:** Passeio manual pelas 7 telas (login, acervo, cifra, palco, editor, repertórios, detalhe) com checklist do Parte C.
- [ ] **Step 5:** Commit final: `feat(ui): redesign Caderno completo`

---

## Fora de escopo (registrado pra depois)
- Capo digital que redesenha shapes (Chordify-style) — pós-redesign.
- Anotações à margem por seção (diferencial "caderno") — feature própria.
- A−/A+ persistido por usuário; 2 colunas de cifra; impressão limpa.
- Dark mode geral (o palco já cobre o caso principal).

## Ordem de execução e dependências
0 → 1 (âncora) → 2 → 3 → 4 → 5. A Fase 1 depende da 0 (Btn + tokens). Fases 2–4 podem rodar em paralelo entre si depois da 0. A Fase 5 é sempre a última.

**Interação com o trabalho de auth:** Fase 5.2 da auth (remover senha) e slugs (Fase 6 da auth) continuam na fila; este redesign não toca em rotas/dados, então pode rodar antes ou intercalado.
