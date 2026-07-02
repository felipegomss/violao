# Spec — Caderno de Estudo de Violão

> Ferramenta pessoal (single-user) para organizar repertório, cifras, gravações e prática de
> violão. Documento vivo — mantido junto com o código (SDD). Última revisão: 2026-07-02.

## 1. Objetivo

Centralizar o estudo de violão: guardar cifras, registrar desempenho ao longo do tempo, linkar
gravações (referência do artista + você tocando) e organizar tudo em repertórios. Foco em
**estudo**, não em consumo/compartilhamento público.

## 2. Escopo e decisões (estado atual)

- **Auth por senha única** (env `APP_PASSWORD`), sessão em cookie assinado (jose). *Desvio da
  ideia original de magic link* — evita infra de e-mail num app de um dono só.
- **Sem storage de arquivo.** Vídeo/áudio só via link de YouTube unlisted.
- **Cifra em dois formatos:** TRADICIONAL (ChordPro, renderizado acorde-sobre-letra) e GRADE
  (songbook/Chediak — parser dedicado ainda pendente; hoje exibido cru).
- **`chordContent` é a fonte única da verdade.** Os metadados vivem em diretivas `{}` no topo do
  texto (ver §6); o app deriva os campos ao salvar.
- **Toggle grau ↔ acorde** e **transposição** — ambos previstos na tela de cifra (a transposição
  foi adicionada ao escopo; convive com o toggle de grau).
- **Design System editorial "Caderno"** — paleta papel/tinta/acento, Newsreader + JetBrains Mono
  (ver §10).
- Sem cifra pública; todo conteúdo protegido atrás de auth.

## 3. Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 + shadcn/ui · Prisma → Neon
Postgres (pooled + directUrl) · Zod · jose · ChordSheetJS (parse ChordPro) · vitest. Deploy Vercel.

## 4. Autenticação

Senha única em `APP_PASSWORD`; `SESSION_SECRET` assina o cookie de sessão (HS256, 30d).
Proteção de rotas no `proxy.ts` (o middleware do Next 16) + `verifySession()` (DAL) em toda
página/action protegida. `getSession()` (não-redireciona) para checagens de UI.

## 5. Modelo de dados (Prisma) — atual

```prisma
model Song {
  id                  String      @id @default(cuid())
  title               String
  artist              String
  genres              String[]
  version             String?
  key                 String                      // tom — referência do toggle de grau/transpose
  capo                Int?
  tuning              String      @default("standard")
  bpm                 Int?
  comoEstouTocando    Int?                        // 1-5, autoavaliação; marcada na view da cifra
  chordFormat         ChordFormat
  chordContent        String      @db.Text        // texto cru no template (fonte única da verdade)
  referenceYoutubeUrl String?
  notes               String?     @db.Text
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  recordings       Recording[]
  practiceSessions PracticeSession[]
  repertoires      RepertoireSong[]
}

enum ChordFormat { TRADICIONAL GRADE }

model Recording {
  id         String   @id @default(cuid())
  songId     String
  song       Song     @relation(fields: [songId], references: [id], onDelete: Cascade)
  youtubeUrl String
  recordedAt DateTime @default(now())
  rating     Int?
  notes      String?
  @@index([songId])
}

model PracticeSession {
  id          String   @id @default(cuid())
  songId      String
  song        Song     @relation(fields: [songId], references: [id], onDelete: Cascade)
  date        DateTime @default(now())
  rating      Int
  durationMin Int?
  notes       String?
  @@index([songId])
}

model Repertoire {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  songs       RepertoireSong[]
}

model RepertoireSong {
  repertoireId String
  songId       String
  repertoire   Repertoire @relation(fields: [repertoireId], references: [id], onDelete: Cascade)
  song         Song       @relation(fields: [songId], references: [id], onDelete: Cascade)
  order        Int?
  @@id([repertoireId, songId])
  @@index([songId])
}
```

> **Mudança vs. spec original:** removidos `difficulty` e o enum `SongStatus`/`status`; adicionado
> `comoEstouTocando Int?` (1–5, marcado depois, na view da cifra).

## 6. Diretivas do template (metadados na cifra)

O cabeçalho do `chordContent` carrega os metadados como diretivas `{chave: valor}` (valor até o
fim da linha). O editor "Nova música" parseia em tempo real e mostra o painel **Detectado**;
editar um campo reescreve a diretiva no texto (round-trip). Parser puro e compartilhado em
`lib/song/directives.ts`.

| Diretiva      | Campo Song            | Regra                                   |
|---------------|-----------------------|-----------------------------------------|
| `{title:}`    | `title`               | obrigatório                             |
| `{artist:}`   | `artist`              | obrigatório                             |
| `{tom:}`      | `key`                 | obrigatório                             |
| `{genero:}`   | `genres[]`            | separados por vírgula                    |
| `{versao:}`   | `version`             | opcional                                |
| `{capo:}`     | `capo`                | opcional, inteiro (inválido → vazio)    |
| `{afinacao:}` | `tuning`              | default `standard`                      |
| `{bpm:}`      | `bpm`                 | opcional, inteiro                       |
| `{youtube:}`  | `referenceYoutubeUrl` | opcional                                |
| `{tipo:}`     | `chordFormat`         | `tradicional` \| `grade`                |

Regras: diretiva ausente → campo vazio/default; desconhecida → ignorada na extração mas
**preservada** no texto; o corpo (após o cabeçalho) é a cifra e não é parseado como metadado.

### Scaffold — Tradicional
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
### Scaffold — Grade
Igual no cabeçalho, com `{tipo: grade}` e corpo:
```
{parte: A}
| C7M | G/B | Am7 | C7/G |
```

> **Nota:** os comps de design usam algumas chaves em PT (`titulo`/`artista`/`capotraste`) e sem
> `{tipo}`. A implementação atual segue as chaves acima (spec da NovaMusica). Alinhar comp↔código
> é um ajuste isolado, se desejado.

## 7. Toggle grau ↔ acorde e transposição

Estado de **view** (não persiste). Grau: converte só a fundamental (e o baixo após `/`) em
numeral romano relativo ao `key`, mantendo o sufixo literal (notação BR intacta: `m7(5-)`, `7M`).
Transposição: desloca a fundamental em semitons. Ambos vivem na tela de cifra. *(Lógica de
referência no comp `Cifra`; wiring pendente — a tela hoje mostra os controles como stub.)*

## 8. Cifra tradicional — render

`parseChordSheet(content)` (`lib/chordsheet/parse.ts`, sobre ChordSheetJS) → view model de linhas
(`row` acorde/letra · `label` seção · `empty`). Render editorial: acorde-chip para linhas só de
acorde, acorde-sobre-letra para letra, labels de seção em laranja. ChordPro malformado cai num
fallback de texto cru sem quebrar a página. GRADE ainda em `<pre>` (parser dedicado pendente).

## 9. Features de prática (roadmap)

Base: player YouTube sticky. Depois: auto-scroll · A-B loop · gráfico de `comoEstouTocando`/
`PracticeSession` no tempo · revisão espaçada · metrônomo (BPM) · modo palco (overlay escuro) ·
diagramas de acorde (chords-db) no popover. Hoje presentes como **stub visual** na tela de cifra.

## 10. Design System "Caderno" (editorial)

- **Paleta:** papel `#e7ddca` · folha `#f8f3e8` · tinta `#26211b` · acento `#1c3c4c` · palco
  `#16130f` · laranja de seção `#b8532c` · ouro/azul de palco. Tokens Tailwind aditivos
  (`bg-paper`, `text-teal`, …) em `app/globals.css`.
- **Tipografia:** Newsreader (serif — títulos & letra) + JetBrains Mono (cifra, tom, bpm, labels),
  via `next/font` (`font-editorial` / `font-cifra`).
- **Shell:** sidebar (acervo/repertório/progresso + logout) compartilhada (`AppSidebar`).
- Telas implementadas: **Login**, **Biblioteca/acervo**, **Visualização da cifra**, **Nova
  música/editor** — todas editoriais e ligadas aos dados reais.

## 11. Telas & rotas (estado atual)

| Rota | Tela | Estado |
|------|------|--------|
| `/login` | Login editorial (senha) | ✅ |
| `/songs` | Biblioteca/acervo (busca, filtros, ordenação) | ✅ |
| `/songs/new` · `/songs/[id]/edit` | Editor template-first (Detectado) | ✅ |
| `/songs/[id]` | Visualização da cifra (render + controles stub) | ✅ render; controles pendentes |

## 12. Pendências / próximos passos

- Ligar os controles da tela de cifra: toggle de grau, transposição, player YouTube + A-B loop,
  auto-scroll, modo palco, diagramas de acorde, metrônomo, marcar `comoEstouTocando`.
- Parser + render do formato **GRADE**.
- Repertórios e revisão espaçada. PWA.
- (Opcional) alinhar chaves de diretiva comp↔código.
