# Fatia 1 — Fundação (Auth + Schema + CRUD de Song)

> Design da primeira fatia vertical do site de estudo de violão.
> Base: `SPEC.md` (spec geral) §5, §11 (roadmap, fatia 1).

## 1. Objetivo da fatia

Deixar de pé a fundação do app: banco provisionado, autenticação single-user,
e um CRUD completo de músicas (Song). Ao fim da fatia, o dono loga com senha,
cria/edita/lista/apaga músicas, e todos os campos do model `Song` persistem no
Neon. Cifra ainda é texto cru (sem parsing/render — isso é fatia 2–3).

## 2. Escopo

### Dentro
- Setup Prisma + Neon Postgres (dev direto contra Neon, URL com pooling).
- Schema Prisma **completo** da spec §5 (todos os models + enums).
- Auth por **senha única** (env), sessão em cookie httpOnly assinado.
- Proteção de rotas via `middleware.ts`.
- CRUD completo de `Song` (listar, criar, ver, editar, apagar).
- Base do shadcn/ui (componentes usados no CRUD).

### Fora (explícito)
- Parsing/render de cifra (tradicional ou grade) — fatia 2–3.
- Toggle grau ↔ acorde — fatia 4.
- Player YouTube, auto-scroll, A-B loop — fatia 5.
- PracticeSession, gravações, gráfico de progresso — fatia 6.
- Repertórios — fatia 7. Diagramas de acorde — fatia 8. PWA — fatia 9.
- Wiring de deploy (Vercel/Neon Marketplace), CI.
- TanStack Query (reavaliar na fatia 5–6, quando telas interativas pagarem o custo).

## 3. Decisões de arquitetura (e divergências da spec geral)

| Tema | Decisão | Divergência da spec? |
|------|---------|----------------------|
| Auth | Senha única em env + cookie HMAC | Sim — spec previa magic link (Auth.js v5). Single-user não justifica infra de e-mail/adapter. |
| Data layer | Server Components (leitura) + Server Actions (mutação) + `revalidatePath` | Sim — spec listava TanStack Query. Adiado; aditivo depois. |
| DB (dev) | Neon direto (URL fornecida pelo dono) | Não (é o destino de produção; só antecipado no dev). |
| Sessão | Cookie assinado com `jose` (HMAC, Edge-compatível) | N/A (spec não detalhava). |
| Schema | Definir o schema inteiro da §5 já, mas só Song ganha UI nesta fatia | N/A. Evita churn de migration. |

## 4. Stack

- **Next.js 16.2.10** (App Router) + **React 19.2.4** — ler guias em
  `node_modules/next/dist/docs/` antes de codar (APIs podem divergir do treino).
- **Tailwind v4** (já no scaffold) + **shadcn/ui**.
- **Prisma** + `@prisma/client` → **Neon Postgres**.
- **Zod** — validação compartilhada entre form e action.
- **jose** — assinatura/verificação do token de sessão (compatível com Edge runtime do middleware).

## 5. Modelo de dados

Schema completo da spec §5, sem alteração de campos. Datasource com dois URLs
(Prisma + Neon serverless):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")           // pooled (pgbouncer) — runtime
  directUrl = env("DATABASE_URL_UNPOOLED")  // direct — migrations
}
```

Models: `Song`, `Recording`, `PracticeSession`, `Repertoire`, `RepertoireSong`.
Enums: `SongStatus { APRENDENDO LAPIDANDO DOMINADA MANUTENCAO }`,
`ChordFormat { TRADICIONAL GRADE }`. (Ver SPEC.md §5 para os campos completos.)

Cliente Prisma: singleton serverless-safe em `lib/prisma.ts` (padrão `globalThis`
para não estourar conexões em hot-reload/serverless).

## 6. Autenticação (senha única)

**Envs:** `APP_PASSWORD` (senha do dono), `SESSION_SECRET` (chave HMAC).

**`lib/auth.ts`:**
- `createSessionToken()` — assina JWT curto (`jose`, HS256) com expiração (ex: 30 dias).
- `verifySessionToken(token)` — valida assinatura + expiração.
- `getSession()` — lê cookie httpOnly, verifica, retorna sessão ou null.
- Comparação de senha em tempo constante (evita timing attack).

**Fluxo:**
- `app/login/page.tsx` — form (client) → Server Action `login(formData)`:
  valida senha → seta cookie `session` (httpOnly, secure, sameSite=lax) → redirect `/songs`.
- Server Action `logout()` — limpa cookie → redirect `/login`.
- `middleware.ts` — intercepta tudo exceto `/login`, assets estáticos e rotas
  internas do Next; sem sessão válida → redirect `/login`. Roda no Edge (por isso `jose`).

## 7. CRUD de Song

**Server Actions** (`app/songs/actions.ts`):
- `createSong(formData)` — Zod valida → `prisma.song.create` → `revalidatePath('/songs')` → redirect detalhe.
- `updateSong(id, formData)` — Zod → `prisma.song.update` → revalidate → redirect.
- `deleteSong(id)` — `prisma.song.delete` → revalidate → redirect lista.

**Rotas (App Router):**
- `app/songs/page.tsx` — lista (Server Component, lê via Prisma). Estado vazio com CTA.
- `app/songs/new/page.tsx` — form de criação.
- `app/songs/[id]/page.tsx` — detalhe (todos os campos; cifra em `<pre>` cru).
- `app/songs/[id]/edit/page.tsx` — form de edição (pré-preenchido).

**`SongForm` (client component):**
- `useActionState` (React 19) para estado de submit/erros.
- Campos: title*, artist*, genres (input de tags), version, key*, capo, tuning,
  bpm, difficulty (1–5), status (select enum), chordFormat (select enum),
  chordContent (textarea), referenceYoutubeUrl, notes. (* = obrigatório)
- Erros de validação exibidos por campo.

**Componentes shadcn/ui:** Button, Input, Textarea, Select, Label, Card, e o que o form pedir.

## 8. Validação (Zod)

`lib/validations/song.ts` — schema único reusado por create e update:
- `title`, `artist`, `key` obrigatórios (string não-vazia).
- `genres` array de strings.
- `capo`, `bpm`, `difficulty` números opcionais (difficulty 1–5).
- `status` e `chordFormat` restritos aos enums.
- `referenceYoutubeUrl` URL válida opcional.

## 9. Fluxo de dados

- **Leitura:** Server Component → `prisma` → render (sem cache de cliente).
- **Mutação:** `<form action={serverAction}>` → Zod → Prisma → `revalidatePath` → `redirect`.
- **Auth:** toda request passa pelo middleware; falha → redirect login.

## 10. Erros

- Server Action retorna `{ error, fieldErrors }` em falha de validação; `SongForm` exibe via `useActionState`.
- Erro de Prisma (ex: registro não existe no edit/detail) → `notFound()` do Next.
- Falha de auth → redirect `/login`.

## 11. Testes

TDD nos pontos de **lógica pura** (onde o custo/benefício fecha):
- **`lib/auth.ts`** — sign/verify de sessão: token válido verifica; adulterado/expirado falha; comparação de senha.
- **`lib/validations/song.ts`** — schemas Zod: aceita payload válido, rejeita inválidos (difficulty fora de 1–5, URL malformada, campos obrigatórios vazios).

Ferramenta: **vitest**.

CRUD contra o banco (integração) fica com **verificação manual** nesta fatia
(rodar o app, criar/editar/apagar uma música, confirmar persistência no Neon).
O grande alvo de TDD puro do projeto é o toggle de grau (fatia 4).

## 12. Ordem de implementação (para o plano)

1. Instalar deps (prisma, @prisma/client, zod, jose, shadcn/ui base) + `npx prisma init` ajustado.
2. Ler guias relevantes do Next 16 (`node_modules/next/dist/docs/`).
3. Schema Prisma completo + `prisma migrate dev` contra Neon.
4. `lib/prisma.ts` singleton.
5. Auth: `lib/auth.ts` (+ testes) → login/logout actions + página → `middleware.ts`.
6. Zod schema de Song (+ testes).
7. Song Server Actions.
8. shadcn/ui setup + `SongForm`.
9. Rotas songs (lista, new, detalhe, edit).
10. Verificação manual do CRUD ponta a ponta.

## 13. Questões deixadas para fatias futuras

- Enarmonia do `key` (Db vs C#) afeta rótulos de grau — fixar convenção na fatia 4.
- Afinação alternativa × digitação no chords-db — fatia 8.
- Múltiplas versões/arranjos (campo `version` vs entidade `Version`) — reavaliar se virar comum.
