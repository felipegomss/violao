import type { ComponentProps } from 'react'

// Botões do Caderno: 3 níveis + danger. Rust SÓ significa perigo;
// estados ativos usam teal. Altura md = 44px (alvo de toque mínimo).
const VARIANTS = {
  primary: 'bg-teal text-folha hover:bg-[#16323f] border border-transparent',
  secondary: 'border border-ink/25 text-ink hover:bg-folha',
  ghost: 'text-teal hover:underline underline-offset-4 border border-transparent',
  danger: 'border border-rust/40 text-rust hover:bg-rust/5',
} as const

const SIZES = {
  md: 'h-11 px-5 text-[13px]',
  sm: 'h-9 px-4 text-[12px]',
  icon: 'h-11 w-11 text-[13px]', // quadrado, sem padding horizontal (ícone-only)
} as const

export function Btn({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<'button'> & {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-cifra lowercase tracking-[.02em] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  )
}
