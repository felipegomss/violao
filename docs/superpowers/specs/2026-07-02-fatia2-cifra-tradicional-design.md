# Fatia 2 — Cifra tradicional (parse ChordPro + render estruturado)

> Design da segunda fatia vertical do site de estudo de violão.
> Base: `SPEC.md` §6.2 (template TRADICIONAL / ChordPro), §7 (toggle de grau — futuro),
> §11 (roadmap, fatia 2). Depende da fatia 1 (CRUD de Song já persiste `chordContent`).

## 1. Objetivo

Transformar o `chordContent` de músicas no formato **TRADICIONAL** (ChordPro) de texto cru
num render estruturado acorde-sobre-letra na página de detalhe. Cada acorde vira um elemento
próprio no DOM, preparando o terreno para o toggle de grau (fatia 4) e os diagramas clicáveis
(fatia 8) sem retrabalho.

## 2. Escopo

### Dentro
- `parseChordSheet(content)` — parser puro/testável que usa ChordSheetJS e produz um view model próprio.
- Componente de render estruturado (acorde-sobre-letra) na página de detalhe.
- Suporte a: pares acorde/letra, linhas só-acorde, linhas só-letra, labels de seção/comentário.
- Fallback gracioso para ChordPro malformado ou vazio (exibe texto cru + aviso).
- Dependência `chordsheetjs`.

### Fora (explícito)
- Formato **GRADE** — fatia 3. Continua renderizado em `<pre>` cru por enquanto.
- **Toggle grau ↔ acorde** — fatia 4. O view model já deixa o acorde acessível, mas nenhuma
  conversão acontece aqui.
- Player YouTube, auto-scroll, A-B loop — fatia 5.
- Diagramas de acorde ao clicar — fatia 8.
- Preview ao vivo da cifra dentro do `SongForm` (editor) — YAGNI; render só no detalhe.
- Transposição — fora do produto inteiro (spec §2).

## 3. Decisão de arquitetura

**Render estruturado em React** (escolhido) em vez do formatter HTML string do ChordSheetJS.

Motivo: fatia 4 (grau por acorde) e fatia 8 (diagrama ao clicar) precisam acessar cada acorde
individualmente. Um HTML string opaco (`HtmlDivFormatter.format()`) forçaria refazer o render
do zero na fatia 4. Renderizar o modelo parseado como componentes deixa cada acorde como um
elemento real desde já.

**Detalhe técnico que simplifica:** o `ChordProParser` guarda o acorde como **string crua** em
`ChordLyricsPair.chords` (não força `Chord.parse` no parsing). Logo, a notação BR (`m7(5-)`,
`7M`, `(9-)`, baixo `G/B`) passa **intacta** no render. O `Chord.parse` da lib (que poderia
engasgar com notação BR) NÃO é usado aqui — a extração de raiz para o grau (fatia 4) usará o
regex custom do §7.

## 4. Unidades e interfaces

Separação pura/render — parser testável sem React, componente de render "burro":

### 4.1 `lib/chordsheet/parse.ts` (puro)
```ts
export type ChordSheetItem = { chord: string | null; lyrics: string }
export type ChordSheetLine =
  | { type: 'row'; items: ChordSheetItem[] }   // acordes sobre letra
  | { type: 'label'; text: string }            // {comment}/{c:} e rótulos de seção
  | { type: 'empty' }                           // linha em branco (respiro visual)
export type ChordSheet = { lines: ChordSheetLine[] }

export function parseChordSheet(content: string): ChordSheet
```
- Usa `ChordProParser` do `chordsheetjs`; itera `song.lines` → `line.items`.
- `ChordLyricsPair` → `{ chord: pair.chords || null, lyrics: pair.lyrics ?? '' }`.
- Diretivas de comentário/seção (`{comment}`, `{c: ...}`, `{start_of_*}` etc.) → `{ type: 'label', text }`.
- Diretivas de metadado (`{title}`, `{artist}`, `{tipo}`, `{key}`…) → ignoradas (título/artista vêm do DB).
- Linha vazia → `{ type: 'empty' }`.
- `chord` fica como **string crua**, verbatim (pronto pro regex de grau da fatia 4).

**O que depende de quê:** `parse.ts` depende só de `chordsheetjs`. Não importa React, DB nem `server-only`.

### 4.2 `app/songs/[id]/chord-sheet.tsx` (render burro)
```ts
export function ChordSheet({ sheet }: { sheet: ChordSheet }): JSX.Element
```
- Recebe o view model, renderiza:
  - `row` → linha de colunas `inline-block`: acorde em cima (destaque, `font-mono`, peso 600), letra embaixo.
  - `label` → rótulo de seção (`text-muted-foreground`, peso médio).
  - `empty` → espaçamento vertical.
- **Server component** nesta fatia (sem estado/interatividade). Na fatia 4 o rótulo do acorde
  vira um client component para receber o toggle; o resto da estrutura permanece.
- Preserva espaços (whitespace) das letras.

## 5. Integração na página de detalhe

`app/songs/[id]/page.tsx`, seção "Cifra":
```
se chordContent vazio            → <pre>(vazio)</pre> (como hoje)
senão se chordFormat TRADICIONAL → tenta parseChordSheet; sucesso → <ChordSheet/>
                                   falha → <pre>{chordContent}</pre> + aviso discreto
senão (GRADE)                    → <pre>{chordContent}</pre> (inalterado; fatia 3 troca)
```
O parse roda no server component (Node). Erros do ChordSheetJS são capturados (try/catch);
qualquer exceção cai no fallback de texto cru com aviso "não foi possível formatar; exibindo
texto cru".

## 6. Estilo

- Acorde-sobre-letra clássico: cada `ChordSheetItem` é uma coluna `inline-block` com alinhamento
  ao início; acorde na linha de cima, sílaba/letra embaixo.
- Acorde: cor de destaque (ex.: `text-primary` ou similar do tema), `font-mono`, peso 600.
- Letra: cor padrão do texto.
- Linhas só-acorde (sem letra) e só-letra funcionam pelo mesmo mecanismo (chord ou lyrics nulo/vazio).
- Labels de seção: `text-muted-foreground`, peso 500, com respiro acima.
- Container com `overflow-x-auto` para cifras largas não estourarem a página (DESIGN.md: sem scroll horizontal no body).

## 7. Testes (TDD)

Alvo puro: **`lib/chordsheet/parse.test.ts`**. Casos:
- ChordPro de exemplo da spec (`[C]Terra em [G]transe...`) → linhas/pares corretos.
- Linha só com acordes (`[C] [G] [Am]` sem letra) → `row` com items de `lyrics` vazio.
- Acorde com baixo invertido `[G/B]` → `chord: 'G/B'` preservado.
- Notação BR `[F#m7(5-)]` → `chord: 'F#m7(5-)'` verbatim (não normalizado/quebrado).
- `{comment: Intro}` / `{c: ...}` → `{ type: 'label', text: 'Intro' }`.
- Diretiva de metadado `{title: X}` → ignorada (não vira linha).
- Linha em branco → `{ type: 'empty' }`.

O componente `ChordSheet` é visual/burro → verificação manual na página de detalhe (renderiza
uma música TRADICIONAL de exemplo e confere o alinhamento acorde-sobre-letra).

## 8. Dependência

- Adicionar `chordsheetjs` (runtime dependency). Confirmar que parseia em Node/Server Component
  no `next build` sem erro. Versão: a mais recente estável.

## 9. Ordem de implementação (para o plano)

1. Instalar `chordsheetjs`.
2. `lib/chordsheet/parse.ts` + testes (TDD): view model + mapeamento do modelo ChordSheetJS.
3. `app/songs/[id]/chord-sheet.tsx` (render burro).
4. Integrar no `app/songs/[id]/page.tsx` (branch por `chordFormat`, fallback).
5. Verificação manual: criar música TRADICIONAL de exemplo, conferir render; confirmar que GRADE
   segue em `<pre>`; confirmar fallback com ChordPro malformado.

## 10. Riscos / atenção

- **API do ChordSheetJS**: os nomes exatos das propriedades do modelo (`song.lines`, `line.items`,
  `item.chords`/`item.lyrics`, e como diretivas de comentário aparecem — `Tag`/`Comment`) devem ser
  confirmados na implementação lendo os tipos do pacote instalado. O parser deve tratar itens que
  não são `ChordLyricsPair` (tags/diretivas) sem quebrar.
- **Detecção de labels**: distinguir diretiva de comentário/seção (vira label) de diretiva de
  metadado (ignorada). Definir a lista exata na implementação a partir dos tipos do ChordSheetJS.
- **Bundle/SSR**: `chordsheetjs` deve rodar server-side; se por acaso trouxer dependência de browser,
  isolar o parse no server (já é o plano). Confirmar no build.
```
