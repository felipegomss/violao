'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createRepertoire } from '@/app/actions/repertoires'
import { Btn } from '@/components/btn'

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
          className="h-11 rounded-lg border border-ink/22 bg-folha px-3 font-cifra text-[14px] outline-none transition-colors duration-150 focus:border-teal focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2"
        />
        <Btn type="submit">criar</Btn>
        <Btn type="button" variant="ghost" onClick={() => setOpen(false)}>
          cancelar
        </Btn>
      </form>
    )
  }

  return (
    <Btn type="button" onClick={() => setOpen(true)}>
      <Plus size={16} strokeWidth={2.25} />
      Novo repertório
    </Btn>
  )
}
