'use client'

import { useActionState, useState } from 'react'
import { setName, type NameState } from '@/app/actions/user'
import { Btn } from '@/components/btn'

// Pede o nome quando a conta ainda não tem um (signup por magic link não coleta).
// Aparece em qualquer tela autenticada; some quando salva. "agora não" adia.
export function NameGate({ needsName }: { needsName: boolean }) {
  const [state, action, pending] = useActionState<NameState, FormData>(setName, undefined)
  const [dismissed, setDismissed] = useState(false)

  if (!needsName || dismissed || state?.ok) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(22,19,15,.4)] p-4">
      <div className="w-full max-w-[400px] rounded-2xl border border-ink/15 bg-folha p-8 shadow-[0_30px_60px_-28px_rgba(38,33,27,.5)]">
        <div className="mb-3.5 font-cifra text-[11px] uppercase tracking-[.18em] text-faint">
          quem é você
        </div>
        <h3 className="font-editorial text-[28px] font-semibold leading-tight text-ink">
          Como quer ser chamado?
        </h3>
        <p className="mt-3 font-editorial text-[17px] italic text-soft">
          Seu nome aparece quando você compartilha um repertório, pra galera saber de quem é.
        </p>

        <form action={action} className="mt-6">
          <input
            name="name"
            autoFocus
            required
            maxLength={60}
            placeholder="seu nome"
            className="h-11 w-full border-0 border-b-[1.5px] border-ink/40 bg-transparent font-cifra text-[16px] text-ink outline-none transition-colors duration-150 placeholder:text-[#a89e8d] focus:border-teal focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2"
          />
          {state?.error && (
            <p role="alert" className="mt-2 font-cifra text-[12px] text-rust">
              {state.error}
            </p>
          )}
          <div className="mt-6 flex items-center gap-3">
            <Btn type="submit" disabled={pending}>
              {pending ? 'Salvando…' : 'Salvar'}
            </Btn>
            <Btn type="button" variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              agora não
            </Btn>
          </div>
        </form>
      </div>
    </div>
  )
}
