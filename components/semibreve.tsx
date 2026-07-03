// Marca do Compasso: uma semibreve (nota inteira) com o furo inclinado clássico.
// Herda a cor via currentColor.
export function Semibreve({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true">
      <mask id="sbv-hole">
        <rect width="40" height="40" fill="#fff" />
        <ellipse cx="20" cy="20" rx="7.9" ry="3.1" transform="rotate(-28 20 20)" fill="#000" />
      </mask>
      <ellipse cx="20" cy="20" rx="12" ry="8.4" fill="currentColor" mask="url(#sbv-hole)" />
    </svg>
  )
}
