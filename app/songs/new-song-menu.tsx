'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ClipboardType, Link2, Plus, type LucideIcon } from 'lucide-react'

const BTN =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-transparent bg-teal px-5 font-cifra text-[13px] lowercase tracking-[.02em] text-folha transition-colors duration-150 hover:bg-[#16323f] focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

function Item({
  href,
  Icon,
  title,
  desc,
  onNav,
}: {
  href: string
  Icon: LucideIcon
  title: string
  desc: string
  onNav: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNav}
      className="flex items-start gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-[#f1eadb]"
    >
      <Icon size={18} strokeWidth={1.75} className="mt-0.5 flex-none text-teal" />
      <span className="min-w-0">
        <span className="block font-editorial text-[15px] font-semibold text-ink">{title}</span>
        <span className="block font-cifra text-[11px] lowercase text-faint">{desc}</span>
      </span>
    </Link>
  )
}

// Botão "Nova música" com dropdown: colar a cifra (editor) ou importar por link.
// Cada opção vai direto pro passo certo em /songs/new (via ?mode=).
export function NewSongMenu({ label = 'Nova música' }: { label?: string }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="relative">
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-10 cursor-default"
          onClick={close}
        />
      )}
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={BTN}>
        <Plus size={16} strokeWidth={2.25} /> {label}
        <ChevronDown size={14} strokeWidth={2.25} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-[280px] rounded-lg border border-ink/20 bg-folha p-1.5 shadow-[0_16px_34px_-14px_rgba(38,33,27,.5)]">
          <Item
            href="/songs/new?mode=edit"
            Icon={ClipboardType}
            title="Colar a cifra"
            desc="acordes entre colchetes"
            onNav={close}
          />
          <Item
            href="/songs/new?mode=import"
            Icon={Link2}
            title="Importar por link"
            desc="do CifraClub ou Cifras"
            onNav={close}
          />
        </div>
      )}
    </div>
  )
}
