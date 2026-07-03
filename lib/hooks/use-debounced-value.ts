'use client'

import { useEffect, useState } from 'react'

// Adia `value` por `ms` — usado pra não bater no servidor a cada tecla da busca.
export function useDebouncedValue<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}
