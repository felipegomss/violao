'use client'

import { useState } from 'react'
import { createRepertoire } from '@/app/actions/repertoires'

export function NovoRepertorio() {
  const [open, setOpen] = useState(false)

  if (open) {
    return (
      <form action={createRepertoire} className="flex items-center gap-2">
        <input
          name="name"
          autoFocus
          placeholder="nome do repertório"
          required
          className="font-cifra text-[14px] bg-folha border border-ink/22 rounded-md px-3 py-2 outline-none focus:border-teal"
        />
        <button
          type="submit"
          className="font-cifra text-[12px] tracking-[.14em] uppercase text-[#f0e9da] bg-teal px-5 py-3 rounded-lg"
        >
          criar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-cifra text-[12px] tracking-[.14em] uppercase text-faint px-3 py-3"
        >
          cancelar
        </button>
      </form>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 font-cifra text-[12px] tracking-[.14em] uppercase text-[#f0e9da] bg-teal px-5 py-3 rounded-lg"
    >
      <span>+</span>
      Novo repertório
    </button>
  )
}
