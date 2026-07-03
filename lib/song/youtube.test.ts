import { describe, expect, it } from 'vitest'
import { youtubeId, formatTime } from './youtube'

describe('youtubeId', () => {
  it('extrai de youtu.be', () => {
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extrai de watch?v= (ignorando outros params)', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe(
      'dQw4w9WgXcQ',
    )
  })

  it('extrai de /embed/ e /shorts/', () => {
    expect(youtubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://youtube.com/shorts/abc123XYZ_-')).toBe('abc123XYZ_-')
  })

  it('URL não-YouTube ou lixo → null', () => {
    expect(youtubeId('https://vimeo.com/12345')).toBeNull()
    expect(youtubeId('não é url')).toBeNull()
    expect(youtubeId('')).toBeNull()
  })
})

describe('formatTime', () => {
  it('formata m:ss com zero à esquerda', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(600)).toBe('10:00')
  })

  it('trata negativos e NaN como 0:00', () => {
    expect(formatTime(-3)).toBe('0:00')
    expect(formatTime(NaN)).toBe('0:00')
  })
})
