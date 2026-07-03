# Compasso — Auth por Magic Link + Multi-conta — Design

**Objetivo:** transformar o app single-user (senha única no env) num produto público **Compasso** com login por email + magic link (signup fluido) e dados isolados por conta.

**Marco:** inclui o rebrand "Caderno de Violão" → **Compasso** (mesmo lançamento).

---

## 1. Decisões travadas

| # | Decisão |
|---|---|
| Email | **Resend** — conta existente, domínio `lfng.dev` verificado. Remetente `compasso@lfng.dev`. |
| Senha | **Removida** — magic link substitui. |
| Dados atuais | Migram para a conta **luisfng123@gmail.com**. |
| Tokens | **DB**, single-use, hash, expiry 15 min. |
| Logo | **Semibreve** (já feito no favicon e sidebar). |
| Rebrand | Junto com a auth. |

## 2. Não-objetivos

- Perfil/nome no signup (fluido; nome fica opcional pra depois).
- OAuth (Google etc.), recuperação de senha, times/compartilhamento entre contas.
- Verificação de "email existe de verdade" além do próprio clique no link.

## 3. Arquitetura (o que muda)

Fundação atual (mantida): sessão JWT `jose` HS256 em cookie httpOnly, DAL com `cache()` (`getSession`/`verifySession`), defense-in-depth no `proxy.ts`. **Só muda o que a sessão carrega e o escopo das queries.**

- **Sessão** passa de `{ sub: 'owner' }` para `{ sub: <userId> }`.
- `proxy.ts` continua validando **só a assinatura** do JWT (sem banco) — troca `sub === 'owner'` por "sessão válida com `sub` string".
- `verifySession()` passa a retornar `{ userId }`; `getSession()` retorna o payload com `sub = userId`.

## 4. Modelo de dados

Duas tabelas novas + `userId` em `Song` e `Repertoire`.

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  createdAt   DateTime @default(now())
  songs       Song[]
  repertoires Repertoire[]
}

model MagicLinkToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique          // sha256 do token cru; nunca guardamos o cru
  email     String                    // permite signup fluido antes do User existir
  expiresAt DateTime                  // now + 15min
  usedAt    DateTime?                 // single-use
  createdAt DateTime @default(now())
  @@index([email])
}

// Song e Repertoire ganham:
  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
```

`Recording` / `PracticeSession` / `RepertoireSong` **não** ganham `userId` — a posse vem via o pai (`Song`/`Repertoire`), desde que as queries do pai sejam escopadas. Também **removemos o enum `ChordFormat`** e a coluna `chordFormat` (legado do modo grade, hoje vestigial) nesta mesma leva de migração — sem migração destrutiva avulsa depois.

## 5. Fluxo do magic link

**Pedir (`/login` → server action `requestMagicLink`)**
1. Valida email (zod).
2. **Rate limit**: se já houver ≥ 5 tokens criados pra esse email nos últimos 15 min, recusa silenciosamente.
3. Invalida (deleta) tokens não usados anteriores do mesmo email.
4. Gera token: 32 bytes aleatórios → base64url (o "cru"); guarda `sha256(cru)` como `tokenHash`, com `email` e `expiresAt = now+15min`.
5. Envia email (Resend) com `${APP_URL}/auth/verify?token=<cru>`.
6. Responde sempre "confira seu email" (resposta idêntica; signup fluido torna enumeração irrelevante).

**Verificar (`/auth/verify` — route handler)**
1. Lê `token` da query, calcula `sha256`.
2. Busca `MagicLinkToken` por `tokenHash`. Rejeita se: inexistente, `usedAt != null`, ou `expiresAt < now` → redireciona `/login?erro=link` com mensagem.
3. Marca `usedAt = now`.
4. **`findOrCreate` do `User` por email** (aqui "email novo = conta nova").
5. Cria sessão `{ sub: user.id }` → redireciona `/songs`.

## 6. Multi-tenancy — escopo das queries

`verifySession()` devolve `userId`; **toda** query passa a escopar por ele. 7 arquivos, ~19 sites:

- `findMany` / `findUnique` → `where: { userId }`.
- `create` → `data: { …, userId }`.
- `update` / `delete` → `where: { id, userId }` (**ownership** — sem isso, um usuário mexe em dado de outro).
- `RepertoireSong` (add/remove/reorder) → confirmar que o repertório é do usuário antes.

Arquivos: `app/songs/page.tsx`, `app/songs/[id]/page.tsx`, `app/songs/[id]/edit/page.tsx`, `app/repertorios/page.tsx`, `app/repertorios/[id]/page.tsx`, `app/actions/songs.ts`, `app/actions/repertoires.ts`. **Auditoria site-a-site é obrigatória** (um `where` sem `userId` = vazamento entre contas).

## 7. Migração & backfill

Ordem (evita `NOT NULL` sem dado):
1. **Migração aditiva**: cria `User`, `MagicLinkToken`; adiciona `userId String?` (nullable) em Song/Repertoire; dropa `chordFormat`/enum `ChordFormat`.
2. **Backfill** (SQL manual, no estilo já usado no projeto): insere `User(email='luisfng123@gmail.com')` e faz `UPDATE Song/Repertoire SET userId = <esse id>`.
3. **Migração de constraint**: `userId … SET NOT NULL` + FK + index.

## 8. Email (Resend)

- Dependência nova: `resend`. Env: `RESEND_API_KEY`, `APP_URL`, remetente fixo `compasso@lfng.dev`.
- `lib/email.ts`: `sendMagicLink(email, url)` — HTML simples com a marca Compasso (semibreve), botão "Entrar no Compasso", aviso de expiração (15 min) e "se não foi você, ignore".
- Fail-loud se `RESEND_API_KEY` faltar (padrão do projeto).

## 9. Segurança

- Token: só o hash no banco, single-use (`usedAt`), expiry 15 min, invalida anteriores.
- Rate limit por email (DB) no pedido.
- Cookie já `httpOnly`/`secure`/`sameSite lax`.
- Enumeração de email: irrelevante (signup fluido).
- IDOR: agora **real** — cobertura de escopo é o item de maior risco.

## 10. Rebrand → Compasso

- `metadata.title`/`description` (`app/layout.tsx`): "Compasso".
- `/login`: copy nova ("Compasso", proposta de valor, fluxo de email em vez de senha).
- Sidebar `aria-label` + favicon: **feitos** (semibreve).
- Textos que citam "Caderno de Violão"/"violão" na home/login → Compasso.
- `package.json` `name` (opcional).

## 11. Testes

- **Puros (unit)**: geração/hash de token, cálculo de expiração, checagem de rate-limit, `youtubeId`-style helpers se houver. `findOrCreate` isolável.
- **Escopo**: revisão adversarial site-a-site (sem cobertura de teso automatizada por falta de DB de teste); opcional: 1 teste de integração do fluxo verify.
- `tsc` + `next build` + `vitest` verdes a cada fatia.

## 12. Fases (ordem de execução)

1. **Schema + migração** (User, MagicLinkToken, userId nullable, drop chordFormat).
2. **Sessão por-usuário** (`session`/`auth`/`proxy` carregam userId).
3. **Escopo + backfill** (19 sites + ownership; backfill; `NOT NULL`).
4. **Email + fluxo magic link** (`requestMagicLink`, `/auth/verify`, `lib/email.ts`).
5. **UI + rebrand** (`/login` email + tela "confira o inbox", copy Compasso, remove senha).

Risco concentra-se na **fase 3** (auditoria de escopo + migração de constraint).
