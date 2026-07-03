'use client'

import { useActionState, useState } from 'react'
import { requestMagicLink, login, type MagicState, type LoginState } from '@/app/actions/auth'
import { Btn } from '@/components/btn'

const INPUT =
  'h-11 w-full border-0 border-b-[1.5px] border-ink/40 bg-transparent font-cifra text-[16px] text-ink outline-none transition-colors duration-150 placeholder:text-[#a89e8d] focus:border-teal focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

export function LoginForm({ linkError }: { linkError?: boolean }) {
  const [mode, setMode] = useState<'email' | 'senha'>('email')
  const [email, setEmail] = useState('')
  const [magic, magicAction, magicPending] = useActionState<MagicState, FormData>(requestMagicLink, undefined)
  const [pw, pwAction, pwPending] = useActionState<LoginState, FormData>(login, undefined)

  if (magic?.sent) {
    return (
      <div className="w-full max-w-[340px]">
        {/* único eyebrow da tela */}
        <div className="mb-3.5 font-cifra text-[11px] uppercase tracking-[.18em] text-faint">Quase lá</div>
        <h3 className="font-editorial text-[32px] font-semibold leading-tight text-ink">Link enviado</h3>
        <p className="mt-3 font-editorial text-[19px] italic text-soft">
          Mandamos um link pra <span className="not-italic text-ink">{email}</span>. Confere a caixa (e o spam). Ele vale por 15 minutos.
        </p>
        <Btn type="button" variant="ghost" size="sm" onClick={() => location.reload()} className="-ml-4 mt-8">
          usar outro email
        </Btn>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[340px]">
      <h3 className="font-editorial text-[32px] font-semibold leading-none text-ink">Entrar</h3>
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
          <label htmlFor="email" className="mb-2 block font-cifra text-[11px] lowercase text-faint">email</label>
          <input id="email" name="email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className={INPUT} />
          {magic?.error && <p role="alert" className="mt-3 font-cifra text-[12px] text-rust">{magic.error}</p>}
          <Btn type="submit" disabled={magicPending} className="mt-7 w-full">
            {magicPending ? 'Enviando…' : 'Enviar link'}
          </Btn>
          <Btn type="button" variant="ghost" size="sm" onClick={() => setMode('senha')} className="-ml-4 mt-4">
            entrar com senha
          </Btn>
        </form>
      ) : (
        <form action={pwAction} className="mt-8">
          <label htmlFor="password" className="mb-2 block font-cifra text-[11px] lowercase text-faint">senha</label>
          <input id="password" name="password" type="password" required autoFocus placeholder="••••••••"
            className={INPUT} />
          {pw?.error && <p role="alert" className="mt-3 font-cifra text-[12px] text-rust">{pw.error}</p>}
          <Btn type="submit" disabled={pwPending} className="mt-7 w-full">
            {pwPending ? 'Entrando…' : 'Entrar'}
          </Btn>
          <Btn type="button" variant="ghost" size="sm" onClick={() => setMode('email')} className="-ml-4 mt-4">
            voltar pro email
          </Btn>
        </form>
      )}
    </div>
  )
}
