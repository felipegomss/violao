'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ellipsis, SquarePen, Trash2 } from 'lucide-react'

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
          className="flex items-center rounded-md border border-ink/22 px-3 py-2.5 text-soft transition-colors hover:text-ink"
        >
          <Ellipsis size={18} strokeWidth={2} />
        </button>
        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-36 rounded-lg border border-ink/20 bg-folha p-1.5 shadow-[0_16px_34px_-14px_rgba(38,33,27,.5)]">
            <Link
              href={`/songs/${songId}/edit`}
              className="flex items-center gap-2 rounded px-2.5 py-2 font-cifra text-[11px] uppercase tracking-wide text-soft hover:bg-[#f1eadb] hover:text-ink"
            >
              <SquarePen size={14} strokeWidth={2} />
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
                className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left font-cifra text-[11px] uppercase tracking-wide text-rust hover:bg-[#f1eadb]"
              >
                <Trash2 size={14} strokeWidth={2} />
                apagar
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
