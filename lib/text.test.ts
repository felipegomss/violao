import { describe, expect, it } from 'vitest'
import { fold, songSearchText, songArtistSort } from './text'

describe('fold', () => {
  it('minúsculo e sem acento', () => {
    expect(fold('Ação')).toBe('acao')
    expect(fold('João GILBERTO')).toBe('joao gilberto')
    expect(fold('  Wave  ')).toBe('wave')
  })
})

describe('songSearchText', () => {
  it('junta título + artistas, dobrado', () => {
    expect(songSearchText('Só Danço Samba', ['João Gilberto'])).toBe('so danco samba joao gilberto')
  })
  it('busca dobrada casa dentro do searchText', () => {
    const st = songSearchText('Garota de Ipanema', ['Tom Jobim', 'Vinícius'])
    expect(st.includes(fold('vinicius'))).toBe(true)
    expect(st.includes(fold('IPANEMA'))).toBe(true)
  })
})

describe('songArtistSort', () => {
  it('usa o 1º artista, dobrado', () => {
    expect(songArtistSort(['Édson', 'Outro'])).toBe('edson')
    expect(songArtistSort([])).toBe('')
  })
})
