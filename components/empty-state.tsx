import type { ReactNode } from 'react'
import { Semibreve } from '@/components/semibreve'

// Estado vazio do Caderno: semibreve sobre a pauta + mensagem + ação.
export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <span className="relative inline-flex h-10 w-24 items-center justify-center text-ink/25">
        <span aria-hidden className="absolute inset-x-0 top-1/2 flex h-7 -translate-y-1/2 flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="block h-px w-full bg-current opacity-60" />
          ))}
        </span>
        <Semibreve size={30} className="relative" />
      </span>
      <p className="font-editorial text-[19px] italic text-soft">{title}</p>
      {action}
    </div>
  )
}
