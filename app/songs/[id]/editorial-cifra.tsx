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

        if (line.type === 'tab') {
          return (
            <pre
              key={i}
              className="my-3 w-fit max-w-full overflow-x-auto rounded-md border border-ink/12 bg-[#efe7d5] px-4 py-3 font-cifra text-[12px] leading-[1.5] text-ink"
            >
              {line.lines.join('\n')}
            </pre>
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
            {line.items.map((item, j) => {
              return (
                <span key={j} className="inline-flex flex-col items-start">
                  {item.chord ? (
                    // pr no próprio acorde: reserva um respiro à direita, então
                    // acordes nunca se colam — mesmo quando a sílaba embaixo é
                    // menor que o acorde (ex.: D6(9) sobre "ção" antes de F#7).
                    <Chord
                      chord={item.chord}
                      onHover={onChordHover}
                      className="h-[15px] pr-2.5 font-cifra text-[12px] font-medium leading-none text-teal"
                    />
                  ) : (
                    <span className="h-[15px] font-cifra text-[12px] leading-none">{' '}</span>
                  )}
                  <span className="whitespace-pre font-cifra text-[15px] leading-[1.5] text-ink">
                    {item.lyrics || ' '}
                  </span>
                </span>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
