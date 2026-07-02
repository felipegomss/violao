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
