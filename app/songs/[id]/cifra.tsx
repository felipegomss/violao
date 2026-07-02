import type { ChordFormat } from '@prisma/client'
import { parseChordSheet } from '@/lib/chordsheet/parse'
import { ChordSheet } from './chord-sheet'

const PRE = 'overflow-x-auto rounded-md border bg-muted p-4 font-mono text-sm'

export function Cifra({
  format,
  content,
}: {
  format: ChordFormat
  content: string
}) {
  if (!content.trim()) {
    return <pre className={PRE}>(vazio)</pre>
  }

  if (format === 'TRADICIONAL') {
    try {
      return <ChordSheet sheet={parseChordSheet(content)} />
    } catch {
      return (
        <>
          <p className="mb-2 text-sm text-muted-foreground">
            Não foi possível formatar a cifra; exibindo texto cru.
          </p>
          <pre className={PRE}>{content}</pre>
        </>
      )
    }
  }

  // GRADE (e qualquer outro) → texto cru; a fatia 3 troca isto.
  return <pre className={PRE}>{content}</pre>
}
