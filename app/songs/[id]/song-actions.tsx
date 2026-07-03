'use client'

import { useState } from 'react'
import Link from 'next/link'

export function SongActions({
  songId,
  deleteAction,
}: {
  songId: string
  deleteAction: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="relative z-20">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          title="Ações"
          aria-label="Ações"
          className="rounded-md border border-ink/22 px-3.5 py-2 font-cifra text-[16px] leading-none text-soft hover:text-ink"
        >
          ⋯
        </button>
        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-36 rounded-lg border border-ink/20 bg-folha p-1.5 shadow-[0_16px_34px_-14px_rgba(38,33,27,.5)]">
            <Link
              href={`/songs/${songId}/edit`}
              className="block rounded px-2.5 py-2 font-cifra text-[11px] uppercase tracking-wide text-soft hover:bg-[#f1eadb] hover:text-ink"
            >
              editar
            </Link>
            <form action={deleteAction}>
              <button
                type="submit"
                onClick={(e) => {
                  if (
                    !confirm(
                      'Apagar esta música? Isso também remove gravações, sessões de prática e vínculos de repertório. Não dá pra desfazer.',
                    )
                  ) {
                    e.preventDefault()
                  }
                }}
                className="block w-full rounded px-2.5 py-2 text-left font-cifra text-[11px] uppercase tracking-wide text-rust hover:bg-[#f1eadb]"
              >
                apagar
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
