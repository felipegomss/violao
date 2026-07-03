import type { ChordShape } from '@/lib/chords/diagram'

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e']
const FRETS = 4

const INK = '#26211b'
const TEAL = '#1c3c4c'
const FOLHA = '#f8f3e8'
const FAINT = '#8a8073'
const SOFT = '#5f574a'

export function ChordDiagram({
  name,
  shape,
  compact = false,
}: {
  name: string
  shape: ChordShape
  compact?: boolean
}) {
  const { frets, fingers, baseFret, barres } = shape

  const W = compact ? 72 : 110
  const padX = compact ? 11 : 17
  const nutY = compact ? 24 : 32
  const fretH = compact ? 15 : 22
  const nameSize = compact ? 12 : 16
  const dotR = compact ? 4.5 : 6.5
  const stringGap = (W - 2 * padX) / 5
  const boardBottom = nutY + FRETS * fretH
  const H = boardBottom + (compact ? 6 : 16)

  const sx = (i: number) => padX + i * stringGap
  const rowCenter = (row: number) => nutY + (row - 0.5) * fretH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block">
      <text
        x={W / 2}
        y={compact ? 13 : 17}
        textAnchor="middle"
        fill={TEAL}
        style={{ fontFamily: 'var(--font-cifra)', fontSize: nameSize, fontWeight: 700 }}
      >
        {name}
      </text>

      {baseFret > 1 && (
        <text
          x={padX - 2}
          y={rowCenter(1) + 3}
          textAnchor="end"
          fill={FAINT}
          style={{ fontFamily: 'var(--font-cifra)', fontSize: compact ? 7 : 8 }}
        >
          {baseFret}ª
        </text>
      )}

      {/* pestana / casa superior */}
      <line
        x1={sx(0)}
        y1={nutY}
        x2={sx(5)}
        y2={nutY}
        stroke={INK}
        strokeWidth={baseFret === 1 ? 3 : 1.2}
      />
      {/* casas */}
      {Array.from({ length: FRETS }, (_, r) => r + 1).map((r) => (
        <line
          key={r}
          x1={sx(0)}
          y1={nutY + r * fretH}
          x2={sx(5)}
          y2={nutY + r * fretH}
          stroke={INK}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}
      {/* cordas */}
      {STRINGS.map((_, i) => (
        <line
          key={i}
          x1={sx(i)}
          y1={nutY}
          x2={sx(i)}
          y2={boardBottom}
          stroke={INK}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      ))}

      {/* marcas de solta (o) / abafada (x) */}
      {frets.map((f, i) =>
        f <= 0 ? (
          <text
            key={i}
            x={sx(i)}
            y={nutY - (compact ? 4 : 6)}
            textAnchor="middle"
            fill={SOFT}
            style={{ fontFamily: 'var(--font-cifra)', fontSize: compact ? 7 : 9 }}
          >
            {f === 0 ? 'o' : 'x'}
          </text>
        ) : null,
      )}

      {/* pestanas (barres) — frets/barres são relativos ao baseFret (casa 1 = 1ª exibida) */}
      {barres.map((b, k) => {
        const row = b
        if (row < 1 || row > FRETS) return null
        const idxs = frets.map((f, i) => (f === b ? i : -1)).filter((i) => i >= 0)
        if (idxs.length < 2) return null
        const x1 = sx(Math.min(...idxs))
        const x2 = sx(Math.max(...idxs))
        return (
          <rect
            key={k}
            x={x1 - dotR + 1.5}
            y={rowCenter(row) - dotR + 1.5}
            width={x2 - x1 + 2 * dotR - 3}
            height={2 * dotR - 3}
            rx={dotR - 1.5}
            fill={TEAL}
          />
        )
      })}

      {/* dedos — o baixo (acorde com barra) vem vazado p/ se destacar */}
      {frets.map((f, i) => {
        if (f <= 0) return null
        const row = f
        if (row < 1 || row > FRETS) return null
        const isBass = i === shape.bassString
        return (
          <g key={i}>
            <circle
              cx={sx(i)}
              cy={rowCenter(row)}
              r={dotR}
              fill={isBass ? FOLHA : TEAL}
              stroke={TEAL}
              strokeWidth={isBass ? 1.8 : 0}
            />
            {!compact && fingers[i] > 0 && (
              <text
                x={sx(i)}
                y={rowCenter(row) + 3}
                textAnchor="middle"
                fill={isBass ? TEAL : FOLHA}
                style={{ fontFamily: 'var(--font-cifra)', fontSize: 8, fontWeight: 700 }}
              >
                {fingers[i]}
              </text>
            )}
          </g>
        )
      })}

      {/* nomes das cordas (só no tamanho cheio; no compacto vira ruído) */}
      {!compact &&
        STRINGS.map((s, i) => (
          <text
            key={i}
            x={sx(i)}
            y={boardBottom + 11}
            textAnchor="middle"
            fill={FAINT}
            style={{ fontFamily: 'var(--font-cifra)', fontSize: 8 }}
          >
            {s}
          </text>
        ))}
    </svg>
  )
}
