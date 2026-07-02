import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'

function isChordOnlyRow(items: { chord: string | null; lyrics: string }[]) {
  return items.every((item) => item.lyrics.trim() === '')
}

export function EditorialCifra({ sheet }: { sheet: ChordSheetModel }) {
  return (
    <div className="flex max-w-[640px] flex-col gap-6">
      {sheet.lines.map((line, i) => {
        if (line.type === 'empty') {
          return <div key={i} className="h-3" aria-hidden />
        }

        if (line.type === 'label') {
          return (
            <div
              key={i}
              className="mb-2.5 border-b border-dotted border-ink/20 pb-1 font-cifra text-[10px] uppercase tracking-[.22em] text-rust"
            >
              {line.text}
            </div>
          )
        }

        if (isChordOnlyRow(line.items)) {
          return (
            <div key={i} className="flex flex-wrap gap-3">
              {line.items.map((item, j) => (
                <span
                  key={j}
                  className="rounded-md border border-teal/30 bg-folha px-2.5 py-1.5 font-cifra text-[14px] font-medium text-teal"
                >
                  {item.chord}
                </span>
              ))}
            </div>
          )
        }

        return (
          <div key={i} className="flex flex-wrap items-end">
            {line.items.map((item, j) => (
              <span key={j} className="inline-flex flex-col items-start">
                <span className="font-cifra text-[13px] font-medium leading-tight text-teal">
                  {item.chord ?? ' '}
                </span>
                <span className="whitespace-pre font-editorial text-[21px] leading-[1.35] text-ink">
                  {item.lyrics}
                </span>
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
