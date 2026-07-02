'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/actions/auth'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  )

  return (
    <form action={action} className="w-full max-w-[340px]">
      <div className="font-cifra text-[10px] uppercase tracking-[.24em] text-faint mb-3.5">
        Entrar
      </div>
      <h3 className="font-editorial text-[38px] leading-none font-medium text-ink">
        Bem-vindo de volta
      </h3>
      <p className="mt-2.5 font-editorial text-[19px] text-soft italic">
        Entre com sua senha.
      </p>

      <div className="mt-9">
        <label
          htmlFor="password"
          className="mb-2 block font-cifra text-[10px] uppercase tracking-[.14em] text-faint"
        >
          senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          placeholder="••••••••"
          className="w-full border-0 border-b-[1.5px] border-ink/40 bg-transparent pt-2 pb-2.5 font-cifra text-[16px] text-ink placeholder:text-[#a89e8d] outline-none focus:border-teal"
        />
      </div>

      {state?.error && (
        <p role="alert" className="mt-3 font-cifra text-[12px] text-rust">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-8 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-teal px-4 py-3.5 font-cifra text-[12px] uppercase tracking-[.16em] text-[#f0e9da] disabled:opacity-50"
      >
        {pending ? (
          'Entrando…'
        ) : (
          <>
            entrar <span className="text-[15px]">→</span>
          </>
        )}
      </button>

      <p className="mt-4.5 font-editorial text-[15px] leading-snug text-faint italic">
        Um caderno, um dono — acesso protegido por senha.
      </p>
    </form>
  )
}
