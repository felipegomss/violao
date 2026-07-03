import { preInner, toChordPro, decodeEntities, type ImportResult } from './engine'

export function isCifras(host: string): boolean {
  return host === 'cifras.com.br' || host.endsWith('.cifras.com.br')
}

// Cifras.com.br: acordes em <span data-chord="X">, seções em <b>Label:</b>
// (o inverso do CifraClub). Normalizamos pro formato do motor: <b>=acorde,
// [..]=seção.
export function parseCifras(html: string): ImportResult {
  const parts = (html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '')
    .replace(/\s*\|\s*CIFRAS\s*$/i, '')
    .split(' - ')
    .map((p) => decodeEntities(p).trim())
  const key =
    html.match(/original-key="([A-G][#b]?m?)"/i)?.[1] ??
    html.match(/data-tom="([A-G][#b]?m?)"/i)?.[1] ??
    ''

  let pre = preInner(html)
  // tabs: <div class='tab__content'>…</div> → protegidas por placeholder,
  // senão a limpeza de divs (elas vivem DENTRO de um acordeão) as engoliria.
  const tabs: string[] = []
  pre = pre.replace(
    /<div[^>]*class=['"][^'"]*tab__content[^'"]*['"][^>]*>([\s\S]*?)<\/div>/g,
    (_m, tab) => {
      tabs.push(String(tab))
      return `@@TAB${tabs.length - 1}@@`
    },
  )
  // divs restantes (anúncio/botão/acordeão embutidos no <pre>) somem com o
  // conteúdo — iterativo de dentro pra fora pra aguentar aninhamento; se o div
  // removido continha placeholders de tab, eles são reemitidos no lugar.
  let prev = ''
  while (prev !== pre) {
    prev = pre
    pre = pre.replace(
      /<div[^>]*>(?:(?!<div)[\s\S])*?<\/div>/g,
      (m) => (m.match(/@@TAB\d+@@/g) ?? []).join('\n'),
    )
  }
  pre = pre.replace(/<(button|svg)[\s\S]*?<\/\1>/g, '')
  // restaura as tabs no formato do motor
  pre = pre.replace(/@@TAB(\d+)@@/g, (_m, i) => `<span class="cnt">${tabs[Number(i)]}</span>`)
  // seções <b>Intro:</b> → [Intro] (tira os dois-pontos)
  pre = pre.replace(/<b[^>]*>\s*([^<]+?):?\s*<\/b>/g, (_m, s) => `[${String(s).trim()}]`)
  // acordes <span data-chord="X">…</span> → <b>X</b>
  pre = pre.replace(
    /<span[^>]*\sdata-chord="([^"]*)"[^>]*>[\s\S]*?<\/span>/g,
    (_m, chord) => `<b>${decodeEntities(String(chord))}</b>`,
  )

  return toChordPro(
    { title: parts[0] ?? '', artist: parts[1] ?? '', key, version: 'Cifras' },
    pre,
  )
}
