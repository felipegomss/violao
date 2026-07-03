// Sugere uma velocidade de auto-scroll (px/s) a partir do BPM e do tamanho da
// página. Ideia: a página inteira deve rolar ~na duração da música. Estimamos a
// duração pelas linhas de cifra (proxy de compassos) e o BPM, e a velocidade é
// a altura rolável dividida por essa duração. Sem BPM, cai num padrão suave.
export function suggestScrollSpeed(opts: {
  scrollable: number // px de rolagem disponíveis
  rows: number // linhas de cifra (proxy de compassos)
  bpm: number | null
  beatsPerLine?: number
  min?: number
  max?: number
}): number {
  const { scrollable, rows, bpm, beatsPerLine = 6, min = 4, max = 80 } = opts
  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  if (!bpm || bpm <= 0 || rows <= 0 || scrollable <= 0) return clamp(14)
  const durationSec = (rows * beatsPerLine * 60) / bpm
  return clamp(Math.round(scrollable / durationSec))
}
