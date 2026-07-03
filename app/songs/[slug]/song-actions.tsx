'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ellipsis, SquarePen, Trash2 } from 'lucide-react'

export function SongActions({
  slug,
  deleteAction,
}: {
  slug: string
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
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-ink/25 text-soft transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2"
        >
          <Ellipsis size={18} strokeWidth={2} />
        </button>
        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-36 rounded-lg border border-ink/20 bg-folha p-1.5 shadow-[0_16px_34px_-14px_rgba(38,33,27,.5)]">
            <Link
              href={`/songs/${slug}/edit`}
              className="flex items-center gap-2 rounded px-2.5 py-2 font-cifra text-[11px] lowercase text-soft transition-colors duration-150 hover:bg-[#f1eadb] hover:text-ink"
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
                className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left font-cifra text-[11px] lowercase text-rust transition-colors duration-150 hover:bg-[#f1eadb]"
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
