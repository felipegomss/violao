'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { SongRow } from '@/app/actions/songs'

// Scroll infinito + reset-on-params pra listas de música (acervo/sidebar/picker).
// - começa de `initialItems` (1ª página vinda do server);
// - quando `params` muda (busca/filtros/ordenação), refaz da página 0;
// - `loadMore` (disparado por um sentinel via IntersectionObserver) anexa a próxima;
// - `rootRef` é o container que rola (a interseção é medida dentro dele).
export function useInfiniteSongs({
  initialItems,
  params,
  pageSize,
  fetchPage,
  rootRef,
}: {
  initialItems: SongRow[]
  params: unknown
  pageSize: number
  fetchPage: (skip: number) => Promise<SongRow[]>
  rootRef?: RefObject<HTMLElement | null>
}) {
  const key = JSON.stringify(params)
  const [items, setItems] = useState<SongRow[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialItems.length >= pageSize)
  // callback ref: reatacha o observer quando o sentinel monta (ex.: modal do
  // picker que só existe quando aberto) — um ref simples não dispararia o effect.
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null)
  const sentinelRef = useCallback((node: HTMLDivElement | null) => setSentinelEl(node), [])

  const fetchRef = useRef(fetchPage)
  fetchRef.current = fetchPage
  const reqId = useRef(0)
  const didMount = useRef(false)

  // Reset quando os params mudam. No 1º render mantém os initialItems do server.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    const id = ++reqId.current
    setLoading(true)
    fetchRef.current(0).then(
      (rows) => {
        if (reqId.current !== id) return
        setItems(rows)
        setHasMore(rows.length >= pageSize)
        setLoading(false)
      },
      () => {
        if (reqId.current === id) setLoading(false)
      },
    )
  }, [key, pageSize])

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    const id = ++reqId.current
    setLoading(true)
    fetchRef.current(items.length).then(
      (rows) => {
        if (reqId.current !== id) return
        setItems((prev) => [...prev, ...rows])
        setHasMore(rows.length >= pageSize)
        setLoading(false)
      },
      () => {
        if (reqId.current === id) setLoading(false)
      },
    )
  }, [loading, hasMore, items.length, pageSize])

  // Observa o sentinel dentro do container que rola.
  useEffect(() => {
    if (!sentinelEl) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { root: rootRef?.current ?? null, rootMargin: '200px' },
    )
    obs.observe(sentinelEl)
    return () => obs.disconnect()
  }, [sentinelEl, loadMore, rootRef])

  return { items, loading, hasMore, sentinelRef }
}
