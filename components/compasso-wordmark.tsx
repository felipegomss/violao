// Wordmark "Compasso": o PRIMEIRO "o" é uma semibreve, sobre 5 linhas de pauta.
// A semibreve usa um viewBox cortado rente à elipse + vertical-align:baseline,
// então se comporta como um glifo "o" (senta na linha de base). A pauta fica
// centrada na altura-x — a semibreve cai ~na linha do meio, feito nota na pauta.
export function CompassoWordmark({
  size = 28,
  className = '',
  staffOpacity = 0.22,
}: {
  size?: number
  className?: string
  staffOpacity?: number
}) {
  return (
    <span
      className={`relative inline-block font-editorial font-medium leading-none tracking-[-0.01em] ${className}`}
      style={{ fontSize: size }}
    >
      {/* pauta: 5 linhas atrás da palavra */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 flex -translate-y-1/2 flex-col justify-between"
        style={{ left: '-0.06em', right: '-0.06em', height: '0.6em' }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="block w-full"
            style={{ height: 1, background: 'currentColor', opacity: staffOpacity }}
          />
        ))}
      </span>

      {/* C + semibreve (1º "o") + mpasso */}
      <span className="relative">
        C
        <svg
          viewBox="8 11 24 18"
          aria-hidden="true"
          style={{ height: '0.52em', width: 'auto', verticalAlign: 'baseline', margin: '0 0.015em' }}
        >
          <mask id="compasso-wordmark-o">
            <rect x="8" y="11" width="24" height="18" fill="#fff" />
            <ellipse cx="20" cy="20" rx="7.9" ry="3.1" transform="rotate(-28 20 20)" fill="#000" />
          </mask>
          <ellipse cx="20" cy="20" rx="12" ry="8.4" fill="currentColor" mask="url(#compasso-wordmark-o)" />
        </svg>
        mpasso
      </span>
    </span>
  )
}
