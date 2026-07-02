import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'

export function ChordSheet({ sheet }: { sheet: ChordSheetModel }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-muted p-4">
      {sheet.lines.map((line, i) => {
        if (line.type === 'empty') {
          return <div key={i} className="h-4" aria-hidden />
        }
        if (line.type === 'label') {
          return (
            <div
              key={i}
              className="mt-4 mb-1 text-sm font-semibold text-muted-foreground first:mt-0"
            >
              {line.text}
            </div>
          )
        }
        return (
          <div key={i} className="flex font-mono text-sm leading-tight">
            {line.items.map((item, j) => (
              <span key={j} className="flex flex-col">
                <span className="h-5 whitespace-pre font-semibold text-primary">
                  {item.chord ?? ''}
                </span>
                <span className="whitespace-pre">{item.lyrics}</span>
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
