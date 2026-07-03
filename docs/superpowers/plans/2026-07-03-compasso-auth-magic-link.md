# Compasso — Auth Magic Link + Multi-conta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** login por email + magic link (signup fluido) com dados por conta, rebrandeado como **Compasso**.

**Architecture:** mantém a base de sessão (JWT `jose` HS256 em cookie httpOnly + DAL `verifySession`). A sessão passa a carregar `userId`; toda query escopa por ele. Tokens de magic link ficam no banco (hash, single-use, 15 min). Email via Resend. Ordem mantém o app funcionando a cada fatia: a senha vira login transitório (mapeado ao único usuário) até o magic link entrar, então é removida.

**Tech Stack:** Next 16 (App Router, route handlers, server actions), Prisma v6 (Neon), jose, zod v4, Resend, vitest.

**Spec:** `docs/superpowers/specs/2026-07-03-compasso-auth-magic-link-design.md`

---

## Estrutura de arquivos

- Novo: `lib/tokens.ts` (+ `.test.ts`) — geração/hash de token, expiração.
- Novo: `lib/email.ts` — `sendMagicLink` via Resend.
- Novo: `app/auth/verify/route.ts` — route handler que valida o token e loga.
- Novo: `prisma/migrations/*` — 2 migrações (aditiva + constraint) + backfill SQL.
- Modificado: `prisma/schema.prisma`, `lib/session.ts`, `lib/auth.ts`, `proxy.ts`, `app/actions/auth.ts`, `app/login/page.tsx`, `app/login/login-form.tsx`, `app/layout.tsx`.
- Modificado (escopo por userId): `app/songs/page.tsx`, `app/songs/[id]/page.tsx`, `app/songs/[id]/edit/page.tsx`, `app/repertorios/page.tsx`, `app/repertorios/[id]/page.tsx`, `app/actions/songs.ts`, `app/actions/repertoires.ts`.
- Removido no fim: `verifyPassword` (`lib/session.ts`), env `APP_PASSWORD`.

---

## FASE 1 — Schema + migração + backfill

### Task 1.1: Schema — User, MagicLinkToken, userId, drop chordFormat

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Editar o schema**

Adicionar os models e remover `chordFormat`/enum:

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  createdAt   DateTime @default(now())
  songs       Song[]
  repertoires Repertoire[]
  tokens      MagicLinkToken[]
}

model MagicLinkToken {
  id        String    @id @default(cuid())
  tokenHash String    @unique
  email     String
  userId    String?
  user      User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([email])
  @@index([userId])
}
```

No model `Song`: remover `chordFormat ChordFormat` e adicionar (nullable por ora):
```prisma
  userId String?
  user   User?  @relation(fields: [userId], references: [id], onDelete: Cascade)
```
mais `@@index([userId])`. Remover o `enum ChordFormat { TRADICIONAL GRADE }`.

No model `Repertoire`: adicionar os mesmos `userId String?` + relação + `@@index([userId])`.

- [ ] **Step 2: Gerar migração sem aplicar (drop é destrutivo → --create-only)**

Run: `npx prisma migrate dev --name add_users_magic_link --create-only`
Expected: cria pasta de migração; NÃO aplica.

- [ ] **Step 3: Revisar/ajustar o SQL da migração**

Garantir no `migration.sql`: `CREATE TABLE "User"`, `CREATE TABLE "MagicLinkToken"`, `ALTER TABLE "Song" ADD COLUMN "userId" TEXT`, `ALTER TABLE "Repertoire" ADD COLUMN "userId" TEXT`, os índices, as FKs (nullable), e `ALTER TABLE "Song" DROP COLUMN "chordFormat"; DROP TYPE "ChordFormat";`. userId **sem** NOT NULL aqui.

- [ ] **Step 4: Aplicar**

Run: `npx prisma migrate deploy && npx prisma generate`
Expected: migração aplicada; client regenerado.

- [ ] **Step 5: Commit**

```bash
git add prisma/ && git commit -m "feat(db): User + MagicLinkToken + userId (nullable); drop chordFormat"
```

### Task 1.2: Backfill — usuário dono + posse dos dados

**Files:**
- Create: `prisma/backfill-owner.ts`

- [ ] **Step 1: Script de backfill**

```ts
// prisma/backfill-owner.ts — roda uma vez; idempotente.
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const OWNER = 'luisfng123@gmail.com'

async function main() {
  const user = await prisma.user.upsert({
    where: { email: OWNER },
    update: {},
    create: { email: OWNER },
  })
  const s = await prisma.song.updateMany({ where: { userId: null }, data: { userId: user.id } })
  const r = await prisma.repertoire.updateMany({ where: { userId: null }, data: { userId: user.id } })
  console.log(`owner ${user.id}: ${s.count} songs, ${r.count} repertoires`)
}
main().finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Rodar o backfill**

Run: `npx tsx prisma/backfill-owner.ts` (ou `node --experimental-strip-types prisma/backfill-owner.ts`)
Expected: imprime contagem > 0 de songs/repertoires migrados.

- [ ] **Step 3: Verificar que não sobrou userId null**

Run: `npx prisma studio` (ou uma query) — confirmar 0 songs/repertoires com `userId` null.

- [ ] **Step 4: Commit**

```bash
git add prisma/backfill-owner.ts && git commit -m "chore(db): backfill do usuário dono (luisfng123)"
```

### Task 1.3: userId NOT NULL

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1:** Trocar `userId String?` → `userId String` e `user User?` → `user User` em `Song` e `Repertoire`.
- [ ] **Step 2:** `npx prisma migrate dev --name song_repertoire_owner_required` (agora não-destrutivo, dados já preenchidos). Expected: aplica sem prompt.
- [ ] **Step 3:** `npx prisma generate`
- [ ] **Step 4: Commit** `git commit -am "feat(db): userId obrigatório em Song/Repertoire"`

---

## FASE 2 — Sessão por-usuário

### Task 2.1: Sessão carrega userId (TDD no helper de token vem na Fase 4; aqui é plumbing)

**Files:**
- Modify: `lib/auth.ts`

- [ ] **Step 1: createSession(userId), getSession→userId, verifySession→{userId}**

```ts
export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + MAX_AGE_MS)
  const token = await encrypt({ sub: userId })
  const cookieStore = await cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export const getSession = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value
  const payload = await decrypt(token)
  return typeof payload?.sub === 'string' ? { userId: payload.sub } : null
})

export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session) redirect('/login')
  return { userId: session.userId }
})
```
(`deleteSession` inalterado.)

### Task 2.2: proxy valida sessão genérica

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1:** Trocar `const isAuth = session?.sub === 'owner'` por `const isAuth = typeof session?.sub === 'string'`. Manter o resto.

### Task 2.3: Login transitório mapeia a senha ao único usuário

**Files:**
- Modify: `app/actions/auth.ts`

- [ ] **Step 1:** No `login`, após `verifyPassword` ok, resolver o usuário e criar sessão:

```ts
import { prisma } from '@/lib/prisma'
// ...
  if (!verifyPassword(password)) return { error: 'Senha incorreta.' }
  const user = await prisma.user.findFirst() // transitório: único usuário
  if (!user) return { error: 'Nenhuma conta configurada.' }
  await createSession(user.id)
  redirect('/songs')
```
(Comentar `// TRANSITÓRIO — removido na Fase 5 junto com a senha`.)

- [ ] **Step 2: Verificar**: `npx tsc --noEmit && npx next build`. Login por senha continua funcionando, agora com sessão por-usuário.
- [ ] **Step 3: Commit** `git commit -am "feat(auth): sessão carrega userId; senha vira login transitório"`

---

## FASE 3 — Escopo das queries + ownership

**Padrão (aplicar em cada site):**
- página/action: `const { userId } = await verifySession()`.
- leitura: `where: { userId }` (ou `where: { id, userId }` no findUnique de detalhe).
- criação: `data: { …, userId }`.
- update/delete: `where: { id, userId }`; se `updateMany`/`deleteMany` retornar `count === 0`, tratar como não-encontrado.
- `RepertoireSong`: antes de add/remove/reorder, confirmar `repertoire.userId === userId`.

### Task 3.1: Escopar Songs

**Files:**
- Modify: `app/songs/page.tsx`, `app/songs/[id]/page.tsx`, `app/songs/[id]/edit/page.tsx`, `app/actions/songs.ts`

- [ ] **Step 1:** `app/songs/page.tsx` — `verifySession()` já roda; capturar `userId` e `prisma.song.findMany({ where: { userId }, orderBy… })`.
- [ ] **Step 2:** `app/songs/[id]/page.tsx` — `findUnique({ where: { id } })` → `findFirst({ where: { id, userId } })`; idem a busca do repertório da playlist (`where: { id: rep, userId }`).
- [ ] **Step 3:** `app/songs/[id]/edit/page.tsx` — mesma troca de `findUnique` por `findFirst({ where: { id, userId } })`.
- [ ] **Step 4:** `app/actions/songs.ts` — `createSong`: `data: { …parsed.data, chordContent, userId }` (remover `chordFormat` que já não existe). `updateSong`/`deleteSong`/`setComoEstouTocando`: trocar por `updateMany`/`deleteMany` com `where: { id, userId }`; validar `count`.
- [ ] **Step 5: Verificar** `npx tsc --noEmit && npx next build`.
- [ ] **Step 6: Commit** `git commit -am "feat(auth): escopo por userId nas Songs + ownership"`

### Task 3.2: Escopar Repertórios

**Files:**
- Modify: `app/repertorios/page.tsx`, `app/repertorios/[id]/page.tsx`, `app/actions/repertoires.ts`

- [ ] **Step 1:** `app/repertorios/page.tsx` — `findMany({ where: { userId }, … })`.
- [ ] **Step 2:** `app/repertorios/[id]/page.tsx` — `findFirst({ where: { id, userId }, include… })`; o "acervo disponível" também `where: { userId }`.
- [ ] **Step 3:** `app/actions/repertoires.ts` — `createRepertoire`: `data: { …, userId }`. Todas as ações que recebem `repertoireId` (rename/delete/add/remove/reorder): primeiro `const rep = await prisma.repertoire.findFirst({ where: { id: repertoireId, userId } })`; se `!rep` → `return`/erro. Só então operar. Ao adicionar música, checar também que a `song` é do `userId`.
- [ ] **Step 4: Verificar** `npx tsc --noEmit && npx next build`.
- [ ] **Step 5: Auditoria adversarial:** reler os 2 arquivos + `songs.ts` procurando qualquer `prisma.(song|repertoire|repertoireSong)` sem `userId` no `where`/`data`. Nenhum pode escapar.
- [ ] **Step 6: Commit** `git commit -am "feat(auth): escopo por userId nos Repertórios + ownership"`

---

## FASE 4 — Email + fluxo magic link

### Task 4.1: Helper de token (TDD)

**Files:**
- Create: `lib/tokens.ts`, `lib/tokens.test.ts`

- [ ] **Step 1: Teste primeiro**

```ts
// lib/tokens.test.ts
import { describe, expect, it } from 'vitest'
import { generateToken, hashToken, isExpired } from './tokens'

describe('tokens', () => {
  it('generateToken é aleatório e url-safe', () => {
    const a = generateToken(), b = generateToken()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(a.length).toBeGreaterThan(20)
  })
  it('hashToken é determinístico e não é o token cru', () => {
    const t = generateToken()
    expect(hashToken(t)).toBe(hashToken(t))
    expect(hashToken(t)).not.toBe(t)
  })
  it('isExpired', () => {
    expect(isExpired(new Date(Date.now() - 1000))).toBe(true)
    expect(isExpired(new Date(Date.now() + 60_000))).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar → falha** `npx vitest run lib/tokens.test.ts` (função não existe).

- [ ] **Step 3: Implementar**

```ts
// lib/tokens.ts
import { randomBytes, createHash } from 'node:crypto'

export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
export function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now()
}
export const TOKEN_TTL_MS = 15 * 60 * 1000
```

- [ ] **Step 4: Rodar → passa.** **Step 5: Commit** `git commit -am "feat(auth): helpers de token (TDD)"`

### Task 4.2: Email via Resend

**Files:**
- Create: `lib/email.ts`
- Modify: `package.json` (dep `resend`), `.env`

- [ ] **Step 1:** `npm i resend`.
- [ ] **Step 2:** Adicionar `RESEND_API_KEY` e `APP_URL` no `.env` (e depois na Vercel). NUNCA commitar `.env`.
- [ ] **Step 3:** `lib/email.ts`:

```ts
import 'server-only'
import { Resend } from 'resend'

const FROM = 'Compasso <compasso@lfng.dev>'

function client() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada')
  return new Resend(key)
}

export async function sendMagicLink(email: string, url: string) {
  await client().emails.send({
    from: FROM,
    to: email,
    subject: 'Seu link de acesso ao Compasso',
    html: `<div style="font-family:system-ui;max-width:420px;margin:0 auto">
      <h2 style="font-weight:600">Compasso</h2>
      <p>Clique pra entrar. O link vale por 15 minutos.</p>
      <p><a href="${url}" style="display:inline-block;background:#1c3c4c;color:#f8f3e8;padding:12px 20px;border-radius:8px;text-decoration:none">Entrar no Compasso</a></p>
      <p style="color:#8a8073;font-size:13px">Se não foi você, ignore este email.</p>
    </div>`,
  })
}
```

- [ ] **Step 4: Commit** `git commit -am "feat(auth): envio de magic link via Resend"`

### Task 4.3: Action requestMagicLink

**Files:**
- Modify: `app/actions/auth.ts`

- [ ] **Step 1: Action** (rate-limit + invalida anteriores + gera + envia):

```ts
import { z } from 'zod'
import { generateToken, hashToken, TOKEN_TTL_MS } from '@/lib/tokens'
import { sendMagicLink } from '@/lib/email'

const EmailSchema = z.email()
export type MagicState = { sent?: boolean; error?: string } | undefined

export async function requestMagicLink(_prev: MagicState, formData: FormData): Promise<MagicState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!EmailSchema.safeParse(email).success) return { error: 'Email inválido.' }

  const since = new Date(Date.now() - TOKEN_TTL_MS)
  const recent = await prisma.magicLinkToken.count({ where: { email, createdAt: { gte: since } } })
  if (recent >= 5) return { sent: true } // rate-limit silencioso

  await prisma.magicLinkToken.deleteMany({ where: { email, usedAt: null } })
  const token = generateToken()
  await prisma.magicLinkToken.create({
    data: { email, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  })
  const url = `${process.env.APP_URL}/auth/verify?token=${token}`
  await sendMagicLink(email, url)
  return { sent: true }
}
```

- [ ] **Step 2: Verificar** `npx tsc --noEmit`. **Step 3: Commit** `git commit -am "feat(auth): action requestMagicLink"`

### Task 4.4: Route handler /auth/verify

**Files:**
- Create: `app/auth/verify/route.ts`

- [ ] **Step 1:**

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken, isExpired } from '@/lib/tokens'
import { createSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const fail = () => NextResponse.redirect(new URL('/login?erro=link', req.nextUrl))
  if (!token) return fail()

  const row = await prisma.magicLinkToken.findUnique({ where: { tokenHash: hashToken(token) } })
  if (!row || row.usedAt || isExpired(row.expiresAt)) return fail()

  await prisma.magicLinkToken.update({ where: { id: row.id }, data: { usedAt: new Date() } })
  const user = await prisma.user.upsert({
    where: { email: row.email },
    update: {},
    create: { email: row.email }, // signup fluido
  })
  await createSession(user.id)
  return NextResponse.redirect(new URL('/songs', req.nextUrl))
}
```

- [ ] **Step 2: Verificar** `npx tsc --noEmit && npx next build`. **Step 3: Commit** `git commit -am "feat(auth): /auth/verify (valida token, signup fluido, cria sessão)"`

---

## FASE 5 — UI + rebrand Compasso

### Task 5.1: Login vira email + tela "confira o inbox"

**Files:**
- Modify: `app/login/login-form.tsx`, `app/login/page.tsx`

- [ ] **Step 1:** Reescrever `login-form.tsx` usando `requestMagicLink`: input `email` (type=email), botão "Enviar link". Quando `state?.sent`, trocar o form pela tela "Enviamos um link pra {email} — confira sua caixa (e o spam)". Mostrar `state?.error` quando houver. Ler `?erro=link` (via prop/searchParams na page) pra avisar "link expirado ou já usado".
- [ ] **Step 2:** `app/login/page.tsx` — copy Compasso: eyebrow "Compasso", headline (ex.: "Compasso"), proposta de valor, remover menção a "senha"/"Bem-vindo de volta". Manter o painel lateral editorial (trocar "Caderno de Violão" por "Compasso").
- [ ] **Step 3: Verificar** `npx next build`. **Step 4: Commit** `git commit -am "feat(auth): login por email/magic link + copy Compasso"`

### Task 5.2: Remover a senha (transitório + verifyPassword + env)

**Files:**
- Modify: `app/actions/auth.ts`, `lib/session.ts`

- [ ] **Step 1:** Remover a action `login` transitória e o `type LoginState`. Manter `logout`.
- [ ] **Step 2:** Remover `verifyPassword` de `lib/session.ts` (e o import de `createHash/timingSafeEqual` se ficar órfão).
- [ ] **Step 3:** Remover `APP_PASSWORD` do `.env` e da Vercel.
- [ ] **Step 4: Verificar** `grep -rn "verifyPassword\|APP_PASSWORD\|LoginState" app lib` → vazio. `npx tsc --noEmit && npx next build`.
- [ ] **Step 5: Commit** `git commit -am "chore(auth): remove login por senha"`

### Task 5.3: Rebrand metadata

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1:** `metadata.title = 'Compasso'`, `description` nova. Favicon/sidebar já são a semibreve.
- [ ] **Step 2: Commit** `git commit -am "feat(brand): metadata Compasso"`

---

## Verificação final

- [ ] `npx tsc --noEmit` limpo.
- [ ] `npx vitest run` verde (inclui `lib/tokens.test.ts`).
- [ ] `npx next build` sucesso.
- [ ] Fluxo manual no deploy: email → recebe link → clica → logado; email novo cria conta; segunda conta não vê acervo da primeira; link reusado/expirado → `/login?erro=link`.
- [ ] Auditoria final de escopo: `grep -rn "prisma\.(song|repertoire|repertoireSong)" app lib` — cada `where`/`data` tem `userId`.
- [ ] Env na Vercel: `RESEND_API_KEY`, `APP_URL`, `SESSION_SECRET`; `APP_PASSWORD` removido.
