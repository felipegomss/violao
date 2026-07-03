'use client'

import { useActionState, useState } from 'react'
import { requestMagicLink, login, type MagicState, type LoginState } from '@/app/actions/auth'

export function LoginForm({ linkError }: { linkError?: boolean }) {
  const [mode, setMode] = useState<'email' | 'senha'>('email')
  const [email, setEmail] = useState('')
  const [magic, magicAction, magicPending] = useActionState<MagicState, FormData>(requestMagicLink, undefined)
  const [pw, pwAction, pwPending] = useActionState<LoginState, FormData>(login, undefined)

  if (magic?.sent) {
    return (
      <div className="w-full max-w-[340px]">
        <div className="mb-3.5 font-cifra text-[10px] uppercase tracking-[.24em] text-faint">Quase lá</div>
        <h3 className="font-editorial text-[34px] font-medium leading-tight text-ink">Link enviado</h3>
        <p className="mt-3 font-editorial text-[18px] italic text-soft">
          Mandamos um link pra <span className="not-italic text-ink">{email}</span>. Confere a caixa (e o spam) — vale por 15 minutos.
        </p>
        <button type="button" onClick={() => location.reload()} className="mt-8 font-cifra text-[11px] uppercase tracking-[.14em] text-teal">
          usar outro email
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[340px]">
      <h3 className="font-editorial text-[34px] font-medium leading-none text-ink">Entrar</h3>
      <p className="mt-3 font-editorial text-[19px] italic text-soft">
        {mode === 'email'
          ? 'Coloca seu email que a gente te manda um link pra entrar.'
          : 'Entre com sua senha.'}
      </p>

      {linkError && (
        <p role="alert" className="mt-4 font-cifra text-[12px] text-rust">
          Esse link já foi usado ou expirou. Pede um novo.
        </p>
      )}

      {mode === 'email' ? (
        <form action={magicAction} className="mt-8">
          <label htmlFor="email" className="mb-2 block font-cifra text-[10px] uppercase tracking-[.14em] text-faint">email</label>
          <input id="email" name="email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="w-full border-0 border-b-[1.5px] border-ink/40 bg-transparent pt-2 pb-2.5 font-cifra text-[16px] text-ink outline-none placeholder:text-[#a89e8d] focus:border-teal" />
          {magic?.error && <p role="alert" className="mt-3 font-cifra text-[12px] text-rust">{magic.error}</p>}
          <button type="submit" disabled={magicPending} className="mt-7 w-full rounded-lg bg-teal py-3.5 font-cifra text-[12px] uppercase tracking-[.14em] text-[#f0e9da] disabled:opacity-50">
            {magicPending ? 'Enviando…' : 'Enviar link'}
          </button>
          <button type="button" onClick={() => setMode('senha')} className="mt-4 block font-cifra text-[10px] uppercase tracking-[.12em] text-faint hover:text-ink">
            entrar com senha
          </button>
        </form>
      ) : (
        <form action={pwAction} className="mt-8">
          <label htmlFor="password" className="mb-2 block font-cifra text-[10px] uppercase tracking-[.14em] text-faint">senha</label>
          <input id="password" name="password" type="password" required autoFocus placeholder="••••••••"
            className="w-full border-0 border-b-[1.5px] border-ink/40 bg-transparent pt-2 pb-2.5 font-cifra text-[16px] text-ink outline-none placeholder:text-[#a89e8d] focus:border-teal" />
          {pw?.error && <p role="alert" className="mt-3 font-cifra text-[12px] text-rust">{pw.error}</p>}
          <button type="submit" disabled={pwPending} className="mt-7 w-full rounded-lg bg-teal py-3.5 font-cifra text-[12px] uppercase tracking-[.14em] text-[#f0e9da] disabled:opacity-50">
            {pwPending ? 'Entrando…' : 'Entrar'}
          </button>
          <button type="button" onClick={() => setMode('email')} className="mt-4 block font-cifra text-[10px] uppercase tracking-[.12em] text-faint hover:text-ink">
            ← voltar pro email
          </button>
        </form>
      )}
    </div>
  )
}
