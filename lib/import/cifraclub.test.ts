import { describe, expect, it } from 'vitest'
import { parseCifraClub } from './cifraclub'

const HTML = `<html><head><title>Minha Canção - Fulano de Tal - Cifra Club</title></head>
<body><span>tom: <a>Gm</a></span>
<pre>[Intro] <b>C</b>  <b>G</b>

<b>C</b>        <b>G</b>
Todos os dias eu canto
<b>Am</b>       <b>F</b>
Sempre a mesma canção
<span class="tablatura">  <b>C</b>
<span class="cnt">E|--0--|
B|--1--|</span></span></pre>
</body></html>`

describe('parseCifraClub', () => {
  const r = parseCifraClub(HTML)

  it('extrai título, artista e tom', () => {
    expect(r.title).toBe('Minha Canção')
    expect(r.artist).toBe('Fulano de Tal')
    expect(r.key).toBe('Gm')
  })

  it('gera o header de diretivas', () => {
    expect(r.content).toContain('{title: Minha Canção}')
    expect(r.content).toContain('{artist: Fulano de Tal}')
    expect(r.content).toContain('{tom: Gm}')
    expect(r.content).toContain('{versao: Cifra Club}')
  })

  it('faz o merge acorde↔letra por coluna', () => {
    expect(r.content).toContain('[C]Todos os [G]dias eu canto')
    expect(r.content).toContain('[Am]Sempre a [F]mesma canção')
  })

  it('seção vira {comment} e a linha só de acordes vira badges', () => {
    expect(r.content).toContain('{comment: Intro}')
    expect(r.content).toContain('[C] [G]')
  })

  it('tab vira bloco {start_of_tab}…{end_of_tab}', () => {
    expect(r.content).toContain('{start_of_tab}')
    expect(r.content).toContain('E|--0--|')
    expect(r.content).toContain('{end_of_tab}')
  })
})
