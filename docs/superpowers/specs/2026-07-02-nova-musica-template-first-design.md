# Fluxo "Nova música" template-first + mudança de schema

> Design de mudança. Refaz o fluxo de criação/edição de música para ser dirigido pelo
> template da cifra (diretivas `{}`), com `chordContent` como fonte única da verdade.
> Também altera o schema (remove `difficulty` e `status`; adiciona `comoEstouTocando`).
> SDD: materializa/atualiza `SPEC.md` (§5, §6). TDD: parser testado antes da implementação.

## 1. Objetivo

Trocar o form de ~12 campos avulsos por um fluxo **template-first**: um editor monoespaçado
pré-preenchido com o scaffold do template, que parseia as diretivas `{}` em tempo real e mostra
um painel "Detectado". Só os campos ausentes aparecem para edição manual, e editá-los reescreve a
diretiva no texto. `chordContent` (texto cru no template) é a fonte única da verdade.

## 2. Escopo

### Dentro
- Mudança de schema (Prisma) + migration: remove `difficulty`; remove `status`/`SongStatus`;
  adiciona `comoEstouTocando Int?` (1–5, nullable, **fora** do form).
- Parser de diretivas puro e compartilhado (`lib/song/directives.ts`) + testes.
- Editor template-first (`SongEditor`, client) substituindo o `SongForm` em **criar e editar**.
- `createSong`/`updateSong` derivando os campos do `chordContent` no servidor.
- Zod atualizado; limpeza de `status`/`difficulty` na lista e no detalhe.
- Materializar/atualizar `SPEC.md` (§5 schema, §6 diretivas).

### Fora (explícito)
- View de leitura da cifra e o controle "como estou tocando" (`comoEstouTocando`) — escopo separado.
- Render do formato GRADE (fatia 3). O editor gera/edita o texto GRADE, mas a **exibição** dele
  continua em `<pre>` (fatia 2 já trata isso).
- Toggle de grau (fatia 4).
- Qualquer mudança de modelo além de `difficulty`/`status`/`comoEstouTocando`.

## 3. Schema (Prisma) — §5

No `model Song`:
- **Remover** `difficulty Int?`.
- **Remover** `status SongStatus @default(APRENDENDO)` e **remover** o `enum SongStatus`.
- **Adicionar** `comoEstouTocando Int?` (1–5, nullable; não setado na criação).

Migration destrutiva (drop de 2 colunas + 1 enum, add de 1 coluna). Autorizada; sem dados reais.

## 4. Parser de diretivas — `lib/song/directives.ts` (puro, compartilhado)

Uma tabela única dirige parse, painel e reescrita:

```ts
// campo Song ← diretiva; flags de tratamento
type Directive = {
  key: string        // nome da diretiva no template (PT-BR, exceto title/artist)
  field: string      // campo do Song derivado
  label: string      // rótulo PT-BR no painel
  required?: boolean // title, artist, tom
  list?: boolean     // genero → string[]
  int?: boolean      // capo, bpm
  default?: string   // afinacao → 'standard'
}
const DIRECTIVES: Directive[] = [
  { key: 'title',   field: 'title',               label: 'Título',      required: true },
  { key: 'artist',  field: 'artist',              label: 'Artista',     required: true },
  { key: 'tom',     field: 'key',                 label: 'Tom',         required: true },
  { key: 'genero',  field: 'genres',              label: 'Gêneros',     list: true },
  { key: 'versao',  field: 'version',             label: 'Versão' },
  { key: 'capo',    field: 'capo',                label: 'Capotraste',  int: true },
  { key: 'afinacao',field: 'tuning',              label: 'Afinação',    default: 'standard' },
  { key: 'bpm',     field: 'bpm',                 label: 'BPM',         int: true },
  { key: 'youtube', field: 'referenceYoutubeUrl', label: 'YouTube' },
  { key: 'tipo',    field: 'chordFormat',         label: 'Formato' },
]
```

**Funções:**
- `parseDirectives(content: string): DerivedFields` — varre linhas `^\s*\{(\w+):\s?(.*)\}\s*$`
  (valor até o fim da linha). Mapeia por `key`. `list` → split por `,` + trim + filtra vazios.
  `int` → `parseInt`; NaN → `undefined` (não derruba). `tipo` → `tradicional`/`grade`
  (case-insensitive) → `TRADICIONAL`/`GRADE`; outro/ausente → default `TRADICIONAL`. `afinacao`
  ausente → `'standard'`. Diretiva **desconhecida** (não está na tabela) → ignorada na extração,
  mas o texto não é alterado (preservada). Corpo (linhas não-diretiva) não é parseado como metadado.
- `setDirective(content: string, key: string, value: string): string` — reescreve a **primeira**
  linha `{key: ...}` com o novo valor. Se não existir, insere no topo (cabeçalho). Round-trip:
  `parseDirectives(setDirective(c, k, v))[field] === valorEsperado`.

`DerivedFields`:
```ts
type DerivedFields = {
  title: string; artist: string; key: string
  genres: string[]; version?: string; capo?: number
  tuning: string; bpm?: number; referenceYoutubeUrl?: string
  chordFormat: 'TRADICIONAL' | 'GRADE'
}
```

Notas:
- Diretivas PT-BR (`{tom}`, `{genero}`, …) NÃO são padrão do ChordSheetJS → ele as trata como meta
  tags e **ignora no render** (fatia 2). Sem poluição visual da cifra.
- Escopo do módulo: só string in/out. Sem React, sem DB, sem `server-only`. Usável no client e no server.

## 5. Scaffolds (template inicial) — §6

Constantes exportadas (ex.: em `lib/song/scaffolds.ts` ou no mesmo módulo):

**Tradicional:**
```
{title: }
{artist: }
{tom: }
{genero: }
{versao: }
{capo: }
{afinacao: standard}
{bpm: }
{youtube: }
{tipo: tradicional}
[C]Cole aqui a letra com os [G]acordes...
```
**Grade:** idem cabeçalho, com `{tipo: grade}` e corpo:
```
{parte: A}
| C7M | G/B | Am7 | C7/G |
```

O cabeçalho (linhas de diretiva) e o corpo (resto) são separados pela primeira linha não-diretiva.

## 6. Editor `SongEditor` (client) — substitui `SongForm`

Estado: `content: string` (único). Painel derivado por `parseDirectives(content)` (estado derivado,
sem estado paralelo — alinhado a react-no-use-effect).

- **Toggle Tradicional | Grade** (topo). Ao trocar: `setDirective(content, 'tipo', novoTipo)` e, se o
  corpo atual === corpo do scaffold do formato anterior (intocado), troca o corpo pelo do novo
  formato; senão preserva. Valores do cabeçalho preservados.
- **Textarea monoespaçada** grande, `value={content}`, onChange → `setContent`.
- **Painel "Detectado":** cada campo da tabela como linha/chip. Obrigatório faltando (title/artist/tom)
  destacado (vermelho) e **bloqueia** o botão. Opcional presente: exibido. Opcional ausente: input
  discreto inline → onChange → `setDirective(content, key, valor)` → `setContent`.
- **Botão único** "Criar"/"Salvar alterações", `disabled` se algum obrigatório faltar.
- **Submit:** `<form>` envia só `content` (hidden ou textarea `name="chordContent"`). O servidor
  re-parseia — não confia em campos derivados do cliente.
- Layout: editor + painel lado a lado no desktop, empilhado no mobile. Labels PT-BR.

Reuso criar/editar: mesmo componente. `new` inicia com o scaffold; `edit` inicia com o
`song.chordContent` existente. Prop `action` (bind do id no edit) e `submitLabel`.

## 7. Server actions — `app/actions/songs.ts`

- `deriveSongFromContent(content: string)` — função (pode viver em `lib/song/directives.ts` ou nas
  actions) que roda `parseDirectives` e devolve o objeto pronto p/ Zod/Prisma.
- `createSong(_prev, formData)`: lê `chordContent = formData.get('chordContent')`, `derive`, valida
  com Zod, `prisma.song.create({ data: { ...derived, chordContent } })`, revalida, redireciona.
- `updateSong(id, _prev, formData)`: idem com `update`.
- Remove leitura de `status`/`difficulty`. `comoEstouTocando` não é setado aqui.

## 8. Zod + limpeza — `lib/validations/song.ts` e telas

- Remove `SONG_STATUS`, `status`, `difficulty` do schema e dos testes.
- Schema valida o objeto derivado: `title`/`artist`/`key` obrigatórios; `genres` array; `capo`/`bpm`
  int opcionais; `tuning` default; `referenceYoutubeUrl` url opcional; `chordFormat` enum; `chordContent`.
- **Lista** (`app/songs/page.tsx`): troca `{s.status}` por `{s.key}` (mostra o tom).
- **Detalhe** (`app/songs/[id]/page.tsx`): remove as linhas `Status` e `Dificuldade`.

## 9. Testes (TDD)

`lib/song/directives.test.ts` (alvo principal):
- Tradicional completo → todos os campos.
- Grade completo → idem + `chordFormat === 'GRADE'`.
- Diretiva ausente (sem `{bpm}`) → campo `undefined`, sem quebrar.
- `{genero: bossa nova, mpb}` → `['bossa nova','mpb']`.
- `{capo: 2}`/`{bpm: 90}` → inteiros; `{capo: abc}` → `undefined` (não derruba).
- Diretiva desconhecida (`{foo: bar}`) → ignorada na extração e **preservada** no texto.
- Round-trip: `setDirective(content,'bpm','90')` então `parseDirectives(...).bpm === 90`.
- `deriveSongFromContent(scaffold preenchido)` → objeto derivado correto (núcleo da action).

**Integração/persistência:** validada em **E2E manual** (colar scaffold → Criar → conferir Song no
Neon com `chordContent` cru intacto e campos derivados). Sem test-DB; não escrever no banco de prod
nos testes automatizados.

## 10. SPEC.md (SDD)

`SPEC.md` não existe como arquivo. Materializar com as seções do projeto (a partir da spec original)
e **§5 (schema atualizado)** + **§6 (mapa de diretivas + scaffolds)** refletindo este design.

## 11. Riscos / atenção

- **Migration destrutiva:** confirmar que a migration dropa `status`/`difficulty`/enum e adiciona
  `comoEstouTocando` limpo. Rodar contra o Neon (fatia 1 já usa `migrate dev`).
- **Referências residuais:** garantir que nenhum lugar ainda leia `song.status`/`song.difficulty`
  após a mudança (grep pós-implementação; `tsc` pega os tipos).
- **`setDirective` idempotência/round-trip:** cobrir no teste; cuidado com diretiva ausente (inserir
  vs. substituir) e com valor vazio.
- **Toggle de formato preservando corpo:** a comparação "corpo == scaffold intocado" precisa ser
  exata; se divergir, preserva (nunca apaga texto do usuário silenciosamente).
- **ChordFormat case:** template usa `tradicional`/`grade` minúsculo; enum Prisma é maiúsculo — o
  parser mapeia.
