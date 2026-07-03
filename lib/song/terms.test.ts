import { describe, expect, it } from 'vitest'
import { canonicalTerms } from './terms'

describe('canonicalTerms', () => {
  it('adota a grafia que já existe (case-insensitive)', () => {
    expect(canonicalTerms(['samba'], ['Samba', 'MPB'])).toEqual(['Samba'])
    expect(canonicalTerms(['SAMBA'], ['Samba'])).toEqual(['Samba'])
  })

  it('mantém a grafia digitada quando é termo novo', () => {
    expect(canonicalTerms(['Forró'], ['Samba'])).toEqual(['Forró'])
  })

  it('dedup dentro da própria lista (ignora caso e espaços)', () => {
    expect(canonicalTerms(['Samba', ' samba ', 'MPB'], [])).toEqual(['Samba', 'MPB'])
  })

  it('descarta vazios e apara espaços', () => {
    expect(canonicalTerms([' Pagode ', '', '  '], [])).toEqual(['Pagode'])
  })
})
