'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import {
  parseDirectives,
  setDirective,
  getDirective,
  toggleFormat,
  DIRECTIVES,
  SCAFFOLD_TRADICIONAL,
  type ChordFormat,
} from '@/lib/song/directives'
import type { SongFormState } from '@/app/actions/songs'

const PANEL = DIRECTIVES.filter((d) => d.key !== 'tipo')

const PLACEHOLDER: Record<string, string> = {
  title: 'digite o título',
  artists: 'digite o artista (vírgula separa vários)',
  key: 'ex.: G, Am, Dm…',
  genres: 'ex.: bossa, mpb',
  version: 'ex.: v2 · songbook',
  capo: 'casa do capo',
  tuning: 'ex.: E A D G B E',
  bpm: 'ex.: 96',
  referenceYoutubeUrl: 'link do YouTube',
}

type Action = (state: SongFormState, formData: FormData) => Promise<SongFormState>

export function SongEditor({
  action,
  initialContent = SCAFFOLD_TRADICIONAL,
  submitLabel = 'Criar música',
  title = 'Nova música',
  backHref = '/songs',
}: {
  action: Action
  initialContent?: string
  submitLabel?: string
  title?: string
  backHref?: string
}) {
  const [state, formAction, pending] = useActionState<SongFormState, FormData>(action, undefined)
  const [content, setContent] = useState(initialContent)

  const format = parseDirectives(content).chordFormat
  const raw = (key: string) => getDirective(content, key)

  const missing = PANEL.filter((d) => d.required && raw(d.key).trim() === '')
  const hasMissing = missing.length > 0
  const filledCount = PANEL.filter((d) => raw(d.key).trim() !== '').length

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-7xl flex-col min-w-0">
      {/* header */}
      <div className="flex items-center justify-between gap-6 border-b border-ink/12 px-8 py-5">
        <div className="flex items-center gap-3.5">
          <Link href={backHref} className="font-cifra text-[15px] text-faint hover:text-ink">
            ‹
          </Link>
          <h2 className="font-editorial font-medium text-[30px] leading-none">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-cifra text-[9px] tracking-[.14em] uppercase text-faint">formato</span>
          <div className="flex overflow-hidden rounded-md border border-ink/22">
            {(['TRADICIONAL', 'GRADE'] as ChordFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setContent((c) => toggleFormat(c, f))}
                className={`font-cifra text-[11px] px-3.5 py-2 ${
                  format === f ? 'bg-teal text-folha' : 'text-soft'
                }`}
              >
                {f === 'TRADICIONAL' ? 'Tradicional' : 'Grade'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* split */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_360px]">
        {/* editor */}
        <div className="flex min-h-0 flex-col border-ink/12 lg:border-r">
          <div className="flex items-center justify-between px-8 pt-3.5 pb-2.5">
            <span className="font-cifra text-[10px] tracking-[.16em] uppercase text-faint">
              Cole ou edite a cifra
            </span>
            <span className="font-cifra text-[10px] text-[#b0a696]">
              campos <span className="text-teal">↔</span> diretivas
            </span>
          </div>
          <textarea
            name="chordContent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="min-h-[420px] flex-1 resize-none border-0 bg-[#fbf7ee] px-8 pt-4 pb-8 font-cifra text-[13.5px] leading-[1.9] text-[#2c2720] outline-none"
          />
        </div>

        {/* detectado — campos editáveis (bi-direcional com o texto) */}
        <aside className="flex min-h-0 flex-col bg-[#efe7d5]">
          <div className="flex items-baseline justify-between border-b border-ink/12 px-5 pt-4 pb-3">
            <span className="font-cifra text-[11px] tracking-[.18em] uppercase text-ink">Detectado</span>
            <span className="font-cifra text-[10px] text-faint">
              {filledCount} de {PANEL.length} campos
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-1.5 pb-4">
            {PANEL.map((d) => {
              const value = raw(d.key)
              const missingReq = !!d.required && value.trim() === ''
              return (
                <div key={d.key} className="border-b border-ink/9 py-3">
                  <label
                    htmlFor={`f-${d.key}`}
                    className={`mb-1.5 block font-cifra text-[9px] tracking-[.14em] uppercase ${
                      missingReq ? 'text-rust' : 'text-faint'
                    }`}
                  >
                    {d.label}
                    {d.required && <span className="text-rust"> *</span>}
                  </label>
                  <input
                    id={`f-${d.key}`}
                    value={value}
                    onChange={(e) => setContent((c) => setDirective(c, d.key, e.target.value))}
                    placeholder={PLACEHOLDER[d.field] ?? ''}
                    aria-invalid={missingReq || undefined}
                    className={`w-full rounded-md border-[1.5px] bg-[#fbf7ee] px-2.5 py-2 font-cifra text-[14px] text-ink outline-none ${
                      missingReq ? 'border-rust' : 'border-ink/15 focus:border-teal'
                    }`}
                  />
                </div>
              )
            })}
          </div>

          <div className="border-t border-ink/12 px-5 py-4">
            {hasMissing && (
              <div className="mb-2.5 font-cifra text-[10px] leading-relaxed text-rust">
                ⚠ preencha o obrigatório: {missing.map((m) => m.label.toLowerCase()).join(', ')}
              </div>
            )}
            {state?.errors && (
              <div className="mb-2.5 font-cifra text-[10px] text-rust">
                {Object.values(state.errors).flat()[0]}
              </div>
            )}
            <button
              type="submit"
              disabled={pending || hasMissing}
              className={`w-full rounded-lg py-3.5 font-cifra text-[12px] tracking-[.14em] uppercase ${
                hasMissing ? 'cursor-not-allowed bg-ink/18 text-faint' : 'bg-teal text-[#f0e9da]'
              }`}
            >
              {pending ? 'Salvando…' : submitLabel}
            </button>
          </div>
        </aside>
      </div>
    </form>
  )
}
