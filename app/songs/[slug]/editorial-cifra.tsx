import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { sectionKeys } from '@/lib/song/sections'

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
        className={`${className} cursor-help transition duration-150 ease-out hover:opacity-60`}
      >
        {chord}
      </span>
    )
  }
  return <span className={className}>{chord}</span>
}

// Acordes e letra usam `em` (base 16px no wrapper): assim o A−/A+ da régua
// (font-size no wrapper) escala a cifra inteira mantendo o alinhamento.
// Labels de seção e blocos de tab ficam em px fixo — são sinalização, não leitura.
export function EditorialCifra({
  sheet,
  onChordHover,
}: {
  sheet: ChordSheetModel
  onChordHover?: (chord: string, el: HTMLElement | null) => void
}) {
  const keys = sectionKeys(sheet.lines)

  return (
    <div className="max-w-[640px]">
      {sheet.lines.map((line, i) => {
        if (line.type === 'empty') {
          return <div key={i} className="h-5" aria-hidden />
        }

        if (line.type === 'label') {
          const k = keys[i]
          return (
            <div
              key={i}
              data-section-key={k}
              className="mt-8 mb-3 flex scroll-mt-20 items-center gap-2 border-l-2 border-rust pl-2.5 font-cifra text-[12px] uppercase tracking-[.08em] text-rust first:mt-0"
            >
              {k && (
                <kbd
                  title={`atalho: ${k}`}
                  className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-rust/40 px-1 text-[10px] font-medium normal-case text-rust"
                >
                  {k}
                </kbd>
              )}
              <span>{line.text}</span>
            </div>
          )
        }

        if (line.type === 'tab') {
          return (
            <pre
              key={i}
              className="my-3 w-fit max-w-full overflow-x-auto rounded-md border border-ink/12 bg-[#efe7d5] px-4 py-3 font-cifra text-[13px] leading-[1.5] text-ink"
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
                  className="rounded-md border border-teal/30 bg-folha px-2 py-1 font-cifra text-[.875em] font-medium text-teal"
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
                      className="h-[1.375em] pr-2.5 font-cifra text-[1em] font-bold leading-none text-teal"
                    />
                  ) : (
                    <span className="h-[1.375em] font-cifra text-[1em] leading-none">{' '}</span>
                  )}
                  <span className="whitespace-pre font-cifra text-[1em] leading-[1.9] text-ink">
                    {item.lyrics || ' '}
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
