import { describe, expect, it } from 'vitest'
import { parseCifras } from './cifras'

const HTML = `<html><head><title>Minha Canção - Fulano de Tal | CIFRAS</title></head>
<body>
<pre><b>Intro:</b>  <span data-chord="C">C</span>  <span data-chord="G">G</span>

<span data-chord="C">C</span>        <span data-chord="G">G</span>
Todos os dias eu canto
<span data-chord="Am">Am</span>       <span data-chord="F">F</span>
Sempre a mesma canção</pre>
</body></html>`

describe('parseCifras (cifras.com.br)', () => {
  const r = parseCifras(HTML)

  it('extrai título e artista (tira o sufixo | CIFRAS)', () => {
    expect(r.title).toBe('Minha Canção')
    expect(r.artist).toBe('Fulano de Tal')
  })

  it('normaliza <b>Intro:</b> pra seção e data-chord pra acorde', () => {
    expect(r.content).toContain('{comment: Intro}')
    expect(r.content).toContain('[C] [G]')
  })

  it('faz o merge acorde↔letra por coluna', () => {
    expect(r.content).toContain('[C]Todos os [G]dias eu canto')
    expect(r.content).toContain('[Am]Sempre a [F]mesma canção')
  })

  it('assina a versão da fonte', () => {
    expect(r.content).toContain('{versao: Cifras}')
  })
})
