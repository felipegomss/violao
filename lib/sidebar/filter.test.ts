import { describe, expect, it } from 'vitest'
import { filterSongs } from './filter'

type S = { slug: string; title: string; artists: string[]; key: string }
const songs: S[] = [
  { slug: 'wave', title: 'Wave', artists: ['Tom Jobim'], key: 'D' },
  { slug: 'garota', title: 'Garota de Ipanema', artists: ['Tom Jobim', 'Vinícius'], key: 'F' },
  { slug: 'so-danco', title: 'Só Danço Samba', artists: ['João Gilberto'], key: 'G' },
]

describe('filterSongs', () => {
  it('q vazio retorna tudo', () => {
    expect(filterSongs(songs, '')).toHaveLength(3)
    expect(filterSongs(songs, '   ')).toHaveLength(3)
  })

  it('casa por título', () => {
    expect(filterSongs(songs, 'wave').map((s) => s.slug)).toEqual(['wave'])
  })

  it('casa por artista', () => {
    expect(filterSongs(songs, 'gilberto').map((s) => s.slug)).toEqual(['so-danco'])
  })

  it('é caixa-insensível', () => {
    expect(filterSongs(songs, 'IPANEMA').map((s) => s.slug)).toEqual(['garota'])
  })

  it('é acento-insensível nos dois lados', () => {
    // busca sem acento acha com acento
    expect(filterSongs(songs, 'danco').map((s) => s.slug)).toEqual(['so-danco'])
    expect(filterSongs(songs, 'vinicius').map((s) => s.slug)).toEqual(['garota'])
  })

  it('não acha nada quando não casa', () => {
    expect(filterSongs(songs, 'zzz')).toHaveLength(0)
  })
})
