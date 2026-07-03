import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'

function isChordOnlyRow(items: { chord: string | null; lyrics: string }[]) {
  return items.every((item) => item.lyrics.trim() === '')
}

function Chord({
  chord,
  onHover,
  className,
}: {
  chord: string
  onHover?: (chord: string, el: HTMLElement | null) => void
  className: string
}) {
  if (onHover) {
    return (
      <span
        onMouseEnter={(e) => onHover(chord, e.currentTarget)}
        onMouseLeave={() => onHover('', null)}
        className={`${className} cursor-help transition hover:opacity-60`}
      >
        {chord}
      </span>
    )
  }
  return <span className={className}>{chord}</span>
}

export function EditorialCifra({
  sheet,
  onChordHover,
}: {
  sheet: ChordSheetModel
  onChordHover?: (chord: string, el: HTMLElement | null) => void
}) {
  return (
    <div className="max-w-[640px]">
      {sheet.lines.map((line, i) => {
        if (line.type === 'empty') {
          return <div key={i} className="h-3" aria-hidden />
        }

        if (line.type === 'label') {
          return (
            <div
              key={i}
              className="mt-6 mb-2 border-b border-dotted border-ink/20 pb-1 font-cifra text-[10px] uppercase tracking-[.22em] text-rust first:mt-0"
            >
              {line.text}
            </div>
          )
        }

        if (isChordOnlyRow(line.items)) {
          return (
            <div key={i} className="my-1.5 flex flex-wrap gap-2.5">
              {line.items.map((item, j) => (
                <Chord
                  key={j}
                  chord={item.chord ?? ''}
                  onHover={onChordHover}
                  className="rounded-md border border-teal/30 bg-folha px-2 py-1 font-cifra text-[13px] font-medium text-teal"
                />
              ))}
            </div>
          )
        }

        return (
          <div key={i} className="flex flex-wrap items-end">
            {line.items.map((item, j) => (
              <span key={j} className="inline-flex flex-col items-start">
                {item.chord ? (
                  <Chord
                    chord={item.chord}
                    onHover={onChordHover}
                    className="h-[15px] font-cifra text-[12px] font-medium leading-none text-teal"
                  />
                ) : (
                  <span className="h-[15px] font-cifra text-[12px] leading-none">{' '}</span>
                )}
                <span className="whitespace-pre font-editorial text-[19px] leading-[1.25] text-ink">
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
