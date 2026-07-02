'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import {
  parseDirectives,
  setDirective,
  toggleFormat,
  DIRECTIVES,
  SCAFFOLD_TRADICIONAL,
  type ChordFormat,
  type DerivedFields,
} from '@/lib/song/directives'
import type { SongFormState } from '@/app/actions/songs'

const PANEL = DIRECTIVES.filter((d) => d.key !== 'tipo')

const FIELD_TYPE: Record<string, 'title' | 'artist' | 'chip' | 'tag' | 'link' | 'mono'> = {
  title: 'title',
  artist: 'artist',
  key: 'chip',
  genres: 'tag',
  referenceYoutubeUrl: 'link',
}

const PLACEHOLDER: Record<string, string> = {
  title: 'digite o título',
  artist: 'digite o artista',
  key: 'ex.: G, Am, Dm…',
}

type Action = (state: SongFormState, formData: FormData) => Promise<SongFormState>

function ValueDisplay({ type, value }: { type: string; value: string }) {
  if (type === 'title')
    return <span className="font-editorial font-medium text-[21px] leading-tight text-ink">{value}</span>
  if (type === 'artist')
    return <span className="font-editorial italic text-[17px] text-soft">{value}</span>
  if (type === 'chip')
    return (
      <span className="inline-block font-cifra text-[14px] font-medium text-folha bg-teal px-2.5 py-1 rounded">
        {value}
      </span>
    )
  if (type === 'tag')
    return (
      <span className="inline-block font-cifra text-[11px] tracking-[.08em] uppercase text-soft border border-ink/24 px-2 py-0.5 rounded">
        {value}
      </span>
    )
  if (type === 'link')
    return <span className="font-cifra text-[13px] text-teal border-b border-teal pb-px">{value}</span>
  return <span className="font-cifra text-[14px] text-ink">{value}</span>
}

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

  const derived = parseDirectives(content)
  const format = derived.chordFormat

  const display = (field: keyof DerivedFields) => {
    const v = derived[field]
    if (Array.isArray(v)) return v.join(', ')
    return v == null ? '' : String(v)
  }

  const missing = PANEL.filter((d) => d.required && display(d.field).trim() === '')
  const hasMissing = missing.length > 0
  const detectedCount = PANEL.filter((d) => display(d.field).trim() !== '').length

  return (
    <form action={formAction} className="flex flex-1 flex-col min-w-0">
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
              diretivas <span className="text-teal">{'{ }'}</span> viram campos →
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

        {/* detectado */}
        <aside className="flex min-h-0 flex-col bg-[#efe7d5]">
          <div className="flex items-baseline justify-between border-b border-ink/12 px-5 pt-4 pb-3">
            <span className="font-cifra text-[11px] tracking-[.18em] uppercase text-ink">Detectado</span>
            <span className="font-cifra text-[10px] text-faint">
              {detectedCount} de {PANEL.length} campos
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-1.5 pb-4">
            {PANEL.map((d) => {
              const val = display(d.field)
              const present = val.trim() !== ''
              const type = FIELD_TYPE[d.field] ?? 'mono'
              const isInput = !!d.required && !present
              return (
                <div key={d.key} className="border-b border-ink/9 py-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span
                      className={`font-cifra text-[9px] tracking-[.14em] uppercase ${
                        isInput ? 'text-rust' : 'text-faint'
                      }`}
                    >
                      {d.label}
                    </span>
                    <span
                      className={`font-cifra text-[8.5px] tracking-[.12em] uppercase ${
                        present ? 'text-[#9aa88f]' : d.required ? 'text-rust' : 'text-transparent'
                      }`}
                    >
                      {present ? 'auto' : d.required ? 'obrigatório' : ''}
                    </span>
                  </div>
                  {present ? (
                    <ValueDisplay type={type} value={val} />
                  ) : isInput ? (
                    <input
                      defaultValue=""
                      placeholder={PLACEHOLDER[d.field] ?? ''}
                      onBlur={(e) => {
                        const v = e.target.value.trim()
                        if (v) setContent((c) => setDirective(c, d.key, v))
                      }}
                      className="w-full rounded-md border-[1.5px] border-rust bg-[#fbf7ee] px-2.5 py-2 font-cifra text-[14px] text-ink outline-none"
                    />
                  ) : (
                    <span className="font-cifra text-[12px] text-[#b0a696]">— não informado</span>
                  )}
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
