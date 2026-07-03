import type { ChordShape } from '@/lib/chords/diagram'

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e']
const ROWS = 4

export function ChordDiagram({ name, shape }: { name: string; shape: ChordShape }) {
  const { frets, baseFret } = shape

  return (
    <div className="w-[200px]">
      <div className="mb-3 font-cifra text-[20px] font-bold text-teal">{name}</div>

      {/* marcas de corda solta (o) / abafada (x) */}
      <div className="grid grid-cols-6">
        {frets.map((f, i) => (
          <span key={i} className="text-center font-cifra text-[11px] text-soft">
            {f === 0 ? 'o' : f === -1 ? 'x' : ''}
          </span>
        ))}
      </div>

      <div className="relative flex">
        {baseFret > 1 && (
          <span className="absolute -left-4 top-[3px] font-cifra text-[9px] text-faint">
            {baseFret}ª
          </span>
        )}
        {/* braço: 4 casas × 6 cordas */}
        <div className="flex-1 rounded-[2px] border-[1.5px] border-ink">
          {Array.from({ length: ROWS }, (_, r) => r + 1).map((row) => (
            <div
              key={row}
              className="grid grid-cols-6 border-t border-ink/35 first:border-t-0"
              style={{ height: 26 }}
            >
              {frets.map((f, i) => {
                const on = f > 0 && f - baseFret + 1 === row
                return (
                  <span
                    key={i}
                    className="flex items-center justify-center border-r border-ink/25 last:border-r-0"
                  >
                    {on && <span className="h-[15px] w-[15px] rounded-full bg-teal" />}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* nomes das cordas */}
      <div className="mt-1 grid grid-cols-6">
        {STRINGS.map((s, i) => (
          <span key={i} className="text-center font-cifra text-[8px] text-faint">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
