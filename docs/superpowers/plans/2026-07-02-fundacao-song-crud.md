# Fatia 1 — Fundação (Auth + Schema + CRUD de Song) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar de pé a fundação do app de estudo de violão — banco Neon via Prisma, login single-user por senha, e CRUD completo de músicas (Song).

**Architecture:** Next.js 16 App Router. Leitura em Server Components (Prisma direto); mutação em Server Actions com `revalidatePath` + `redirect`. Sessão stateless em cookie httpOnly assinado com `jose` (JWT HS256). Proteção de rotas via `proxy.ts` (o antigo middleware, renomeado no Next 16, roda em Node.js runtime) + checagem `verifySession()` (DAL) próxima aos dados.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript, Tailwind v4, shadcn/ui, Prisma + `@prisma/client` (Neon Postgres), Zod (v3), jose, vitest.

---

## Convenções deste plano

- **Node via nvm.** O ambiente não tem node no PATH por padrão. **Todo** comando `node`/`npm`/`npx` deve ser precedido de:
  ```bash
  export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
  ```
  (Abreviado como `<nvm>` nos passos abaixo — cole o bloco antes do comando.)
- **`.env` já existe** (gitignored) com `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `APP_PASSWORD`, `SESSION_SECRET`. Não commitar.
- Sem `src/` — `app/` e `proxy.ts` ficam na raiz. Alias `@/*` → raiz.
- Commits frequentes, um por task (ou por par teste+implementação).

## Referências (docs do Next 16, já instaladas)

- Server Actions / mutação: `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- Proxy (ex-middleware): `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
- Auth / sessão stateless: `node_modules/next/dist/docs/01-app/02-guides/authentication.md`

## Mapa de arquivos

**Criar:**
- `.nvmrc` — fixa node 20.20.2
- `vitest.config.ts` — config de teste + alias `@`
- `prisma/schema.prisma` — schema completo da spec §5
- `lib/prisma.ts` — singleton do PrismaClient
- `lib/session.ts` — **puro/testável**: `encrypt`, `decrypt`, `verifyPassword`
- `lib/session.test.ts` — testes de session.ts
- `lib/auth.ts` — `server-only`: `createSession`, `deleteSession`, `verifySession` (DAL)
- `lib/validations/song.ts` — schema Zod de Song (+ tipos)
- `lib/validations/song.test.ts` — testes do schema
- `app/actions/auth.ts` — Server Actions `login`, `logout`
- `app/login/page.tsx` — página de login (Server Component wrapper)
- `app/login/login-form.tsx` — form client (`useActionState`)
- `proxy.ts` — proteção de rotas
- `app/actions/songs.ts` — Server Actions `createSong`, `updateSong`, `deleteSong`
- `app/songs/song-form.tsx` — form client reutilizável (criar/editar)
- `app/songs/page.tsx` — lista
- `app/songs/new/page.tsx` — criar
- `app/songs/[id]/page.tsx` — detalhe
- `app/songs/[id]/edit/page.tsx` — editar
- `components/ui/*` — componentes shadcn (gerados via CLI)
- `lib/utils.ts` — helper `cn` (gerado pelo shadcn init)

**Modificar:**
- `package.json` — deps + scripts de teste
- `.env` — anexar `&pgbouncer=true` na `DATABASE_URL` (compat Prisma + PgBouncer)
- `app/page.tsx` — vira redirect para `/songs`
- `app/layout.tsx` — metadata + nav mínima (título + logout)

---

## Task 1: Setup de dependências e tooling

**Files:**
- Create: `.nvmrc`, `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Fixar a versão do node**

Create `.nvmrc`:
```
20.20.2
```

- [ ] **Step 2: Instalar dependências de runtime**

Run:
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npm install @prisma/client zod jose server-only
npm install -D prisma vitest
```
Expected: instala sem erro; `package.json` ganha as deps.

- [ ] **Step 3: Adicionar scripts de teste ao package.json**

Modify `package.json` — no bloco `"scripts"`, adicionar:
```json
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
```

- [ ] **Step 4: Config do vitest com alias `@`**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 5: Sanidade — vitest roda (sem testes ainda)**

Run:
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npx vitest run
```
Expected: "No test files found" (exit 0 ou aviso), sem erro de config.

- [ ] **Step 6: Commit**

```bash
git add .nvmrc vitest.config.ts package.json package-lock.json
git commit -m "chore: deps da fatia 1 (prisma, zod, jose, vitest) + scripts"
```

---

## Task 2: Schema Prisma + migration contra Neon

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `.env`

- [ ] **Step 1: Ajustar DATABASE_URL para PgBouncer (Prisma)**

Modify `.env` — na linha `DATABASE_URL`, anexar `&pgbouncer=true` ao final da query string (mantém `channel_binding` e `sslmode`). A `DATABASE_URL_UNPOOLED` fica inalterada (é a direct, usada nas migrations).

Resultado esperado da linha:
```
DATABASE_URL="postgresql://neondb_owner:...-pooler.../neondb?channel_binding=require&sslmode=require&pgbouncer=true"
```

- [ ] **Step 2: Escrever o schema completo**

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

model Song {
  id                  String   @id @default(cuid())
  title               String
  artist              String
  genres              String[]
  version             String?
  key                 String
  capo                Int?
  tuning              String   @default("standard")
  bpm                 Int?
  difficulty          Int?
  status              SongStatus  @default(APRENDENDO)
  chordFormat         ChordFormat
  chordContent        String   @db.Text
  referenceYoutubeUrl String?
  notes               String?  @db.Text
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  recordings       Recording[]
  practiceSessions PracticeSession[]
  repertoires      RepertoireSong[]
}

enum SongStatus {
  APRENDENDO
  LAPIDANDO
  DOMINADA
  MANUTENCAO
}

enum ChordFormat {
  TRADICIONAL
  GRADE
}

model Recording {
  id         String   @id @default(cuid())
  songId     String
  song       Song     @relation(fields: [songId], references: [id], onDelete: Cascade)
  youtubeUrl String
  recordedAt DateTime @default(now())
  rating     Int?
  notes      String?
}

model PracticeSession {
  id          String   @id @default(cuid())
  songId      String
  song        Song     @relation(fields: [songId], references: [id], onDelete: Cascade)
  date        DateTime @default(now())
  rating      Int
  durationMin Int?
  notes       String?
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
}
```

- [ ] **Step 3: Rodar a migration inicial**

Run:
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npx prisma migrate dev --name init
```
Expected: cria `prisma/migrations/<timestamp>_init/`, aplica no Neon, gera o Prisma Client. Saída "Your database is now in sync with your schema."

Se falhar com erro de prepared statements na pooled URL, confirmar que a migration está usando `directUrl` (unpooled) — o schema acima já configura isso.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: schema Prisma completo (spec §5) + migration inicial no Neon"
```

---

## Task 3: Singleton do Prisma Client

**Files:**
- Create: `lib/prisma.ts`

- [ ] **Step 1: Escrever o singleton serverless-safe**

Create `lib/prisma.ts`:
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 2: Verificar que compila/typa**

Run:
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npx tsc --noEmit
```
Expected: sem erros (o Prisma Client já foi gerado na Task 2).

- [ ] **Step 3: Commit**

```bash
git add lib/prisma.ts
git commit -m "feat: singleton do Prisma Client (serverless-safe)"
```

---

## Task 4: Módulo de sessão puro (TDD)

Lógica testável, **sem** `server-only` nem `next/headers`: assinar/verificar JWT e comparar senha em tempo constante.

**Files:**
- Create: `lib/session.ts`
- Test: `lib/session.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Create `lib/session.test.ts`:
```ts
import { beforeAll, describe, expect, it } from 'vitest'
import { encrypt, decrypt, verifyPassword } from './session'

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-please-change-32bytes-long'
  process.env.APP_PASSWORD = 'senha-correta'
})

describe('encrypt/decrypt', () => {
  it('faz roundtrip do payload', async () => {
    const token = await encrypt({ sub: 'owner' })
    const payload = await decrypt(token)
    expect(payload?.sub).toBe('owner')
  })

  it('rejeita token adulterado', async () => {
    const token = await encrypt({ sub: 'owner' })
    const tampered = token.slice(0, -3) + 'xyz'
    const payload = await decrypt(tampered)
    expect(payload).toBeNull()
  })

  it('rejeita lixo', async () => {
    expect(await decrypt('not-a-jwt')).toBeNull()
    expect(await decrypt(undefined)).toBeNull()
  })
})

describe('verifyPassword', () => {
  it('aceita a senha correta', () => {
    expect(verifyPassword('senha-correta')).toBe(true)
  })

  it('rejeita senha errada', () => {
    expect(verifyPassword('errada')).toBe(false)
  })

  it('rejeita senha de tamanho diferente', () => {
    expect(verifyPassword('x')).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar para ver falhar**

Run:
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npx vitest run lib/session.test.ts
```
Expected: FAIL — `Failed to resolve import './session'` / funções não existem.

- [ ] **Step 3: Implementar o mínimo**

Create `lib/session.ts`:
```ts
import { createHash, timingSafeEqual } from 'node:crypto'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const encodedKey = () => new TextEncoder().encode(process.env.SESSION_SECRET)

export async function encrypt(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(encodedKey())
}

export async function decrypt(
  token: string | undefined,
): Promise<JWTPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, encodedKey(), {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD ?? ''
  // sha256 fixa o tamanho dos buffers → timingSafeEqual não lança
  const a = createHash('sha256').update(input).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}
```

- [ ] **Step 4: Rodar para ver passar**

Run:
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npx vitest run lib/session.test.ts
```
Expected: PASS — todos os testes verdes.

- [ ] **Step 5: Commit**

```bash
git add lib/session.ts lib/session.test.ts
git commit -m "feat: módulo de sessão puro (jose + senha constant-time) com testes"
```

---

## Task 5: Camada de auth com cookies + DAL

Usa `next/headers` (não testável em unit — verificação manual depois).

**Files:**
- Create: `lib/auth.ts`

- [ ] **Step 1: Escrever createSession / deleteSession / verifySession**

Create `lib/auth.ts`:
```ts
import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { encrypt, decrypt } from '@/lib/session'

const COOKIE = 'session'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export async function createSession() {
  const expiresAt = new Date(Date.now() + MAX_AGE_MS)
  const token = await encrypt({ sub: 'owner', expiresAt: expiresAt.toISOString() })
  const cookieStore = await cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}

// DAL: usar em pages/actions protegidas. Redireciona se não autenticado.
export const verifySession = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value
  const payload = await decrypt(token)
  if (payload?.sub !== 'owner') {
    redirect('/login')
  }
  return { isAuth: true as const }
})
```

- [ ] **Step 2: Verificar tipos**

Run:
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npx tsc --noEmit
```
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: camada de auth (cookie de sessão + DAL verifySession)"
```

---

## Task 6: Server Actions de login/logout

**Files:**
- Create: `app/actions/auth.ts`

- [ ] **Step 1: Escrever as actions**

Create `app/actions/auth.ts`:
```ts
'use server'

import { redirect } from 'next/navigation'
import { verifyPassword } from '@/lib/session'
import { createSession, deleteSession } from '@/lib/auth'

export type LoginState = { error?: string } | undefined

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '')
  if (!verifyPassword(password)) {
    return { error: 'Senha incorreta.' }
  }
  await createSession()
  redirect('/songs')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
```

- [ ] **Step 2: Verificar tipos**

Run: `<nvm> npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/actions/auth.ts
git commit -m "feat: server actions de login/logout"
```

---

## Task 7: Página de login

**Files:**
- Create: `app/login/page.tsx`, `app/login/login-form.tsx`

- [ ] **Step 1: Form client com useActionState**

Create `app/login/login-form.tsx`:
```tsx
'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/actions/auth'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  )

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          className="h-11 rounded-md border border-input bg-background px-3 text-base"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-primary px-4 font-medium text-primary-foreground disabled:opacity-40"
      >
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Página wrapper**

Create `app/login/page.tsx`:
```tsx
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-semibold">Estudo de Violão</h1>
      <LoginForm />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/login
git commit -m "feat: página de login"
```

---

## Task 8: Proteção de rotas via proxy.ts

No Next 16 o antigo `middleware.ts` chama-se `proxy.ts` e exporta `proxy`. Roda em Node.js runtime.

**Files:**
- Create: `proxy.ts`

- [ ] **Step 1: Escrever o proxy**

Create `proxy.ts` (na raiz do projeto):
```ts
import { NextResponse, type NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

const PUBLIC_ROUTES = ['/login']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_ROUTES.includes(pathname)

  const token = req.cookies.get('session')?.value
  const session = await decrypt(token)
  const isAuth = session?.sub === 'owner'

  if (!isAuth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
  if (isAuth && isPublic) {
    return NextResponse.redirect(new URL('/songs', req.nextUrl))
  }
  return NextResponse.next()
}

export const config = {
  // Não roda em assets internos do Next nem em arquivos estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

- [ ] **Step 2: Verificar tipos**

Run: `<nvm> npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: proxy.ts protegendo rotas (redirect login <-> songs)"
```

---

## Task 9: Home redireciona para /songs

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Substituir a home do scaffold por um redirect**

Replace conteúdo de `app/page.tsx`:
```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/songs')
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: home redireciona para /songs"
```

---

## Task 10: Schema Zod de Song (TDD)

**Files:**
- Create: `lib/validations/song.ts`
- Test: `lib/validations/song.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Create `lib/validations/song.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { SongSchema } from './song'

const valid = {
  title: 'Carta ao Tom 74',
  artist: 'Toquinho',
  key: 'C',
  genres: ['MPB'],
  status: 'APRENDENDO',
  chordFormat: 'GRADE',
  chordContent: '| C7M | G/B |',
}

describe('SongSchema', () => {
  it('aceita payload mínimo válido', () => {
    const r = SongSchema.safeParse(valid)
    expect(r.success).toBe(true)
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

  it('rejeita difficulty fora de 1–5', () => {
    expect(SongSchema.safeParse({ ...valid, difficulty: 9 }).success).toBe(false)
    expect(SongSchema.safeParse({ ...valid, difficulty: 0 }).success).toBe(false)
  })

  it('rejeita status/chordFormat inválidos', () => {
    expect(SongSchema.safeParse({ ...valid, status: 'X' }).success).toBe(false)
    expect(SongSchema.safeParse({ ...valid, chordFormat: 'Y' }).success).toBe(false)
  })

  it('rejeita referenceYoutubeUrl malformada', () => {
    expect(
      SongSchema.safeParse({ ...valid, referenceYoutubeUrl: 'nao-e-url' }).success,
    ).toBe(false)
  })

  it('aceita opcionais ausentes e aplica default de tuning', () => {
    const r = SongSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.tuning).toBe('standard')
  })
})
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `<nvm> npx vitest run lib/validations/song.test.ts`
Expected: FAIL — `Failed to resolve import './song'`.

- [ ] **Step 3: Implementar o schema**

Create `lib/validations/song.ts`:
```ts
import { z } from 'zod'

export const SONG_STATUS = [
  'APRENDENDO',
  'LAPIDANDO',
  'DOMINADA',
  'MANUTENCAO',
] as const

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
  difficulty: z.number().int().min(1).max(5).optional(),
  status: z.enum(SONG_STATUS),
  chordFormat: z.enum(CHORD_FORMAT),
  chordContent: z.string().default(''),
  referenceYoutubeUrl: z.string().url('URL inválida').optional(),
  notes: z.string().optional(),
})

export type SongInput = z.infer<typeof SongSchema>
```

- [ ] **Step 4: Rodar para ver passar**

Run: `<nvm> npx vitest run lib/validations/song.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/validations/song.ts lib/validations/song.test.ts
git commit -m "feat: schema Zod de Song com testes"
```

---

## Task 11: Server Actions de Song (create/update/delete)

Converte FormData → objeto limpo (strings vazias viram `undefined`, números coeridos, genres split por vírgula), valida com Zod, persiste, revalida, redireciona.

**Files:**
- Create: `app/actions/songs.ts`

- [ ] **Step 1: Escrever as actions**

Create `app/actions/songs.ts`:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { SongSchema } from '@/lib/validations/song'

export type SongFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? undefined : s
}

function num(v: FormDataEntryValue | null): number | undefined {
  const s = str(v)
  if (s === undefined) return undefined
  const n = Number(s)
  return Number.isNaN(n) ? undefined : n
}

function parseSongForm(formData: FormData) {
  const genresRaw = str(formData.get('genres'))
  return {
    title: str(formData.get('title')) ?? '',
    artist: str(formData.get('artist')) ?? '',
    key: str(formData.get('key')) ?? '',
    genres: genresRaw
      ? genresRaw.split(',').map((g) => g.trim()).filter(Boolean)
      : [],
    version: str(formData.get('version')),
    capo: num(formData.get('capo')),
    tuning: str(formData.get('tuning')) ?? 'standard',
    bpm: num(formData.get('bpm')),
    difficulty: num(formData.get('difficulty')),
    status: str(formData.get('status')) ?? 'APRENDENDO',
    chordFormat: str(formData.get('chordFormat')) ?? 'TRADICIONAL',
    chordContent: (formData.get('chordContent') as string) ?? '',
    referenceYoutubeUrl: str(formData.get('referenceYoutubeUrl')),
    notes: str(formData.get('notes')),
  }
}

export async function createSong(
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  await verifySession()
  const parsed = SongSchema.safeParse(parseSongForm(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const song = await prisma.song.create({ data: parsed.data })
  revalidatePath('/songs')
  redirect(`/songs/${song.id}`)
}

export async function updateSong(
  id: string,
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  await verifySession()
  const parsed = SongSchema.safeParse(parseSongForm(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  await prisma.song.update({ where: { id }, data: parsed.data })
  revalidatePath('/songs')
  revalidatePath(`/songs/${id}`)
  redirect(`/songs/${id}`)
}

export async function deleteSong(id: string) {
  await verifySession()
  await prisma.song.delete({ where: { id } })
  revalidatePath('/songs')
  redirect('/songs')
}
```

> **Nota de tipos:** `parsed.data` bate com o `Prisma.SongCreateInput` porque os campos opcionais são `undefined` (não incluídos) e `genres` é `string[]`. Se o `tsc` reclamar de algum enum, garantir que `status`/`chordFormat` do Zod (string literal union) são aceitos pelo tipo gerado do Prisma — são, pois os valores coincidem com os enums.

- [ ] **Step 2: Verificar tipos**

Run: `<nvm> npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/actions/songs.ts
git commit -m "feat: server actions de Song (create/update/delete)"
```

---

## Task 12: shadcn/ui + componentes base

**Files:**
- Create (via CLI): `components.json`, `lib/utils.ts`, `components/ui/{button,input,textarea,label,select,card}.tsx`
- Modify (via CLI): `app/globals.css`, `tsconfig.json` (o CLI pode ajustar), `package.json`

- [ ] **Step 1: Inicializar shadcn**

Run:
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npx shadcn@latest init -d
```
Expected: cria `components.json`, `lib/utils.ts` (helper `cn`), instala deps (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`), ajusta `globals.css` com as variáveis de tema. Aceitar defaults (base color neutral).

> Se o init interativo pedir input, escolher: TypeScript sim, style default, base color Neutral, CSS variables sim.

- [ ] **Step 2: Adicionar os componentes usados no CRUD**

Run:
```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20.20.2 >/dev/null
npx shadcn@latest add button input textarea label select card
```
Expected: cria `components/ui/button.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `select.tsx`, `card.tsx`.

- [ ] **Step 3: Verificar build/tipos**

Run: `<nvm> npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: setup shadcn/ui + componentes base (button, input, select, etc.)"
```

---

## Task 13: SongForm (client, reutilizável criar/editar)

Usa os componentes shadcn. Recebe `action` (já vinculada) e valores iniciais opcionais.

**Files:**
- Create: `app/songs/song-form.tsx`

- [ ] **Step 1: Escrever o form**

Create `app/songs/song-form.tsx`:
```tsx
'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SONG_STATUS, CHORD_FORMAT } from '@/lib/validations/song'
import type { SongFormState } from '@/app/actions/songs'

type SongDefaults = {
  title?: string
  artist?: string
  key?: string
  genres?: string[]
  version?: string | null
  capo?: number | null
  tuning?: string
  bpm?: number | null
  difficulty?: number | null
  status?: string
  chordFormat?: string
  chordContent?: string
  referenceYoutubeUrl?: string | null
  notes?: string | null
}

type Action = (
  state: SongFormState,
  formData: FormData,
) => Promise<SongFormState>

function Field({
  label,
  htmlFor,
  errors,
  children,
}: {
  label: string
  htmlFor: string
  errors?: string[]
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {errors?.[0] && <p className="text-sm text-red-600">{errors[0]}</p>}
    </div>
  )
}

export function SongForm({
  action,
  defaults = {},
  submitLabel = 'Salvar',
}: {
  action: Action
  defaults?: SongDefaults
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState<SongFormState, FormData>(
    action,
    undefined,
  )
  const e = state?.errors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Título *" htmlFor="title" errors={e.title}>
          <Input id="title" name="title" defaultValue={defaults.title} required />
        </Field>
        <Field label="Artista *" htmlFor="artist" errors={e.artist}>
          <Input id="artist" name="artist" defaultValue={defaults.artist} required />
        </Field>
        <Field label="Tom *" htmlFor="key" errors={e.key}>
          <Input id="key" name="key" defaultValue={defaults.key} required />
        </Field>
        <Field label="Gêneros (separados por vírgula)" htmlFor="genres" errors={e.genres}>
          <Input id="genres" name="genres" defaultValue={defaults.genres?.join(', ')} />
        </Field>
        <Field label="Versão / arranjo" htmlFor="version" errors={e.version}>
          <Input id="version" name="version" defaultValue={defaults.version ?? ''} />
        </Field>
        <Field label="Capotraste (casa)" htmlFor="capo" errors={e.capo}>
          <Input id="capo" name="capo" type="number" min={0} max={12} defaultValue={defaults.capo ?? ''} />
        </Field>
        <Field label="Afinação" htmlFor="tuning" errors={e.tuning}>
          <Input id="tuning" name="tuning" defaultValue={defaults.tuning ?? 'standard'} />
        </Field>
        <Field label="BPM" htmlFor="bpm" errors={e.bpm}>
          <Input id="bpm" name="bpm" type="number" min={20} max={400} defaultValue={defaults.bpm ?? ''} />
        </Field>
        <Field label="Dificuldade (1–5)" htmlFor="difficulty" errors={e.difficulty}>
          <Input id="difficulty" name="difficulty" type="number" min={1} max={5} defaultValue={defaults.difficulty ?? ''} />
        </Field>
        <Field label="Status" htmlFor="status" errors={e.status}>
          <select
            id="status"
            name="status"
            defaultValue={defaults.status ?? 'APRENDENDO'}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {SONG_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Formato da cifra" htmlFor="chordFormat" errors={e.chordFormat}>
          <select
            id="chordFormat"
            name="chordFormat"
            defaultValue={defaults.chordFormat ?? 'TRADICIONAL'}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {CHORD_FORMAT.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Link YouTube (referência)" htmlFor="referenceYoutubeUrl" errors={e.referenceYoutubeUrl}>
          <Input id="referenceYoutubeUrl" name="referenceYoutubeUrl" defaultValue={defaults.referenceYoutubeUrl ?? ''} />
        </Field>
      </div>

      <Field label="Cifra (texto cru)" htmlFor="chordContent" errors={e.chordContent}>
        <Textarea id="chordContent" name="chordContent" rows={12} className="font-mono" defaultValue={defaults.chordContent} />
      </Field>
      <Field label="Anotações do professor" htmlFor="notes" errors={e.notes}>
        <Textarea id="notes" name="notes" rows={4} defaultValue={defaults.notes ?? ''} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `<nvm> npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/songs/song-form.tsx
git commit -m "feat: SongForm reutilizável (criar/editar)"
```

---

## Task 14: Rotas de Song (lista, criar, detalhe, editar)

**Files:**
- Create: `app/songs/page.tsx`, `app/songs/new/page.tsx`, `app/songs/[id]/page.tsx`, `app/songs/[id]/edit/page.tsx`

- [ ] **Step 1: Lista**

Create `app/songs/page.tsx`:
```tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default async function SongsPage() {
  await verifySession()
  const songs = await prisma.song.findMany({ orderBy: { updatedAt: 'desc' } })

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Músicas</h1>
        <Button asChild>
          <Link href="/songs/new">Nova música</Link>
        </Button>
      </div>

      {songs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="mb-4">Nenhuma música ainda.</p>
          <Button asChild>
            <Link href="/songs/new">Adicionar a primeira</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {songs.map((s) => (
            <li key={s.id}>
              <Link
                href={`/songs/${s.id}`}
                className="flex items-center justify-between rounded-md border p-4 hover:bg-accent"
              >
                <span>
                  <span className="font-medium">{s.title}</span>{' '}
                  <span className="text-muted-foreground">— {s.artist}</span>
                </span>
                <span className="text-sm text-muted-foreground">{s.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Criar**

Create `app/songs/new/page.tsx`:
```tsx
import Link from 'next/link'
import { verifySession } from '@/lib/auth'
import { createSong } from '@/app/actions/songs'
import { SongForm } from '@/app/songs/song-form'

export default async function NewSongPage() {
  await verifySession()
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/songs" className="text-sm text-muted-foreground hover:underline">
          ← Músicas
        </Link>
        <h1 className="text-2xl font-semibold">Nova música</h1>
      </div>
      <SongForm action={createSong} submitLabel="Criar" />
    </main>
  )
}
```

- [ ] **Step 3: Detalhe**

Create `app/songs/[id]/page.tsx`:
```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { deleteSong } from '@/app/actions/songs'
import { Button } from '@/components/ui/button'

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await verifySession()
  const { id } = await params
  const song = await prisma.song.findUnique({ where: { id } })
  if (!song) notFound()

  const deleteThis = deleteSong.bind(null, song.id)

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/songs" className="text-sm text-muted-foreground hover:underline">
            ← Músicas
          </Link>
          <h1 className="text-2xl font-semibold">
            {song.title}{' '}
            <span className="font-normal text-muted-foreground">— {song.artist}</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href={`/songs/${song.id}/edit`}>Editar</Link>
          </Button>
          <form action={deleteThis}>
            <Button type="submit" variant="destructive">Apagar</Button>
          </form>
        </div>
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <Meta label="Tom" value={song.key} />
        <Meta label="Status" value={song.status} />
        <Meta label="Formato" value={song.chordFormat} />
        <Meta label="Afinação" value={song.tuning} />
        {song.capo != null && <Meta label="Capo" value={String(song.capo)} />}
        {song.bpm != null && <Meta label="BPM" value={String(song.bpm)} />}
        {song.difficulty != null && <Meta label="Dificuldade" value={String(song.difficulty)} />}
        {song.version && <Meta label="Versão" value={song.version} />}
        {song.genres.length > 0 && <Meta label="Gêneros" value={song.genres.join(', ')} />}
      </dl>

      {song.referenceYoutubeUrl && (
        <p className="mb-6 text-sm">
          Referência:{' '}
          <a href={song.referenceYoutubeUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
            {song.referenceYoutubeUrl}
          </a>
        </p>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">Cifra</h2>
        <pre className="overflow-x-auto rounded-md border bg-muted p-4 font-mono text-sm">
          {song.chordContent || '(vazio)'}
        </pre>
      </section>

      {song.notes && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Anotações</h2>
          <p className="whitespace-pre-wrap text-sm">{song.notes}</p>
        </section>
      )}
    </main>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
```

- [ ] **Step 4: Editar**

Create `app/songs/[id]/edit/page.tsx`:
```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { updateSong } from '@/app/actions/songs'
import { SongForm } from '@/app/songs/song-form'

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await verifySession()
  const { id } = await params
  const song = await prisma.song.findUnique({ where: { id } })
  if (!song) notFound()

  const action = updateSong.bind(null, song.id)

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/songs/${song.id}`} className="text-sm text-muted-foreground hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Editar</h1>
      </div>
      <SongForm action={action} defaults={song} submitLabel="Salvar alterações" />
    </main>
  )
}
```

> **Nota:** `updateSong` tem assinatura `(id, state, formData)`. O `.bind(null, song.id)` fixa o `id`, resultando em `(state, formData)` — compatível com o `Action` esperado pelo `SongForm`.

- [ ] **Step 5: Verificar tipos**

Run: `<nvm> npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add app/songs
git commit -m "feat: rotas de Song (lista, criar, detalhe, editar)"
```

---

## Task 15: Layout raiz com nav + logout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Atualizar metadata e adicionar nav condicional**

O header só aparece fora do `/login`. Como o layout raiz não sabe a rota facilmente, mantemos um header simples com logout que só faz sentido logado; o proxy garante que `/login` não mostra conteúdo protegido. Solução limpa: header renderiza logout apenas se houver sessão.

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { logout } from '@/app/actions/auth'
import './globals.css'

export const metadata: Metadata = {
  title: 'Estudo de Violão',
  description: 'Repertório, cifras e prática de violão',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = (await cookies()).get('session')?.value
  const isAuth = (await decrypt(token))?.sub === 'owner'

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {isAuth && (
          <header className="border-b">
            <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
              <Link href="/songs" className="font-semibold">
                🎸 Estudo de Violão
              </Link>
              <form action={logout}>
                <button type="submit" className="text-sm text-muted-foreground hover:underline">
                  Sair
                </button>
              </form>
            </div>
          </header>
        )}
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `<nvm> npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: layout raiz com nav + logout (condicional à sessão)"
```

---

## Task 16: Verificação manual ponta a ponta

**Files:** nenhum (verificação).

- [ ] **Step 1: Rodar a suíte de testes completa**

Run: `<nvm> npx vitest run`
Expected: PASS — testes de `session` e `song` verdes.

- [ ] **Step 2: Build de produção (pega erros de RSC/tipos)**

Run: `<nvm> npm run build`
Expected: build conclui sem erro.

- [ ] **Step 3: Subir o dev server**

Run (background): `<nvm> npm run dev`
Expected: sobe em `http://localhost:3000`.

- [ ] **Step 4: Checklist manual no navegador**

- [ ] Acessar `/songs` sem login → redireciona para `/login`.
- [ ] Senha errada → mensagem "Senha incorreta."
- [ ] Senha correta (`APP_PASSWORD` do `.env`) → vai para `/songs` (lista vazia com CTA).
- [ ] Criar música com todos os campos → persiste, redireciona ao detalhe, dados corretos.
- [ ] Criar música deixando Título vazio → erro de validação no campo.
- [ ] Editar música → alterações salvam e aparecem no detalhe.
- [ ] Apagar música → some da lista.
- [ ] `genres` "MPB, Bossa" → aparece como dois gêneros.
- [ ] Recarregar `/songs` logado → continua logado (cookie persiste).
- [ ] "Sair" → volta para `/login`; `/songs` volta a redirecionar.

- [ ] **Step 5: Confirmar persistência no Neon (opcional)**

Run: `<nvm> npm run db:studio` → conferir a tabela `Song` com os registros criados.

- [ ] **Step 6: Commit final (se houver ajustes) e fechamento da fatia**

```bash
git add -A && git commit -m "chore: ajustes da verificação manual da fatia 1" || echo "nada a commitar"
```

---

## Self-Review (autor)

**Cobertura do spec (2026-07-02-fundacao-song-crud-design.md):**
- §3 Setup Prisma+Neon → Tasks 2, 3. ✅
- §3 Schema completo §5 → Task 2. ✅
- §4 Auth senha única + cookie assinado → Tasks 4, 5, 6, 7. ✅
- §4 Proteção via proxy (middleware) → Task 8. ✅ (renomeado corretamente p/ Next 16)
- §5 CRUD completo de Song → Tasks 11, 13, 14. ✅
- §5 shadcn base → Task 12. ✅
- §8 Validação Zod → Tasks 10, 11. ✅
- §11 Testes (TDD em auth + Zod; CRUD manual) → Tasks 4, 10, 16. ✅

**Placeholders:** nenhum "TBD"/"TODO" com conteúdo faltando — todo passo tem código/comando completo. ✅

**Consistência de tipos:** `SongFormState`/`SongInput` definidos na Task 10/11 e reusados na 13/14; `login`/`LoginState` na 6 e usados na 7; `verifySession`/`createSession`/`deleteSession` na 5 e usados em 6/8/11/14/15; `SongSchema`/`SONG_STATUS`/`CHORD_FORMAT` na 10 e usados em 11/13. `updateSong(id, state, formData)` + `.bind(null, id)` documentado na 14. ✅

**Riscos conhecidos / pontos de atenção durante execução:**
1. `npx shadcn@latest init` pode ser interativo — se travar, rodar sem `-d` e responder os prompts (defaults indicados na Task 12).
2. Zod v4 pode ser instalado em vez de v3; se `error.flatten()` acusar deprecation/quebra, trocar por `z.flattenError(error)` (mesma forma `{ fieldErrors }`). Testes da Task 10 pegam isso.
3. Prisma + PgBouncer: se surgir erro de prepared statement em runtime, confirmar `pgbouncer=true` na `DATABASE_URL` (Task 2, Step 1).
4. `params` é `Promise` no Next 16 (já tratado com `await params` nas rotas dinâmicas).
