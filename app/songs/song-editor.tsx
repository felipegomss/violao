'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  parseDirectives,
  setDirective,
  toggleFormat,
  PANEL_FIELDS,
  SCAFFOLD_TRADICIONAL,
  type ChordFormat,
} from '@/lib/song/directives'
import type { SongFormState } from '@/app/actions/songs'

type Action = (
  state: SongFormState,
  formData: FormData,
) => Promise<SongFormState>

export function SongEditor({
  action,
  initialContent = SCAFFOLD_TRADICIONAL,
  submitLabel = 'Criar',
}: {
  action: Action
  initialContent?: string
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState<SongFormState, FormData>(
    action,
    undefined,
  )
  const [content, setContent] = useState(initialContent)

  const derived = parseDirectives(content)
  const format = derived.chordFormat
  const missingRequired =
    !derived.title.trim() || !derived.artist.trim() || !derived.key.trim()

  const display = (field: (typeof PANEL_FIELDS)[number]['field']) => {
    const v = derived[field]
    if (Array.isArray(v)) return v.join(', ')
    return v == null ? '' : String(v)
  }

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit rounded-md border p-1">
          {(['TRADICIONAL', 'GRADE'] as ChordFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setContent((c) => toggleFormat(c, f))}
              className={`rounded px-3 py-1 text-sm ${
                format === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {f === 'TRADICIONAL' ? 'Tradicional' : 'Grade'}
            </button>
          ))}
        </div>
        <Textarea
          name="chordContent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={22}
          spellCheck={false}
          className="font-mono text-sm"
        />
      </div>

      <aside className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Detectado</h2>
        {PANEL_FIELDS.map((d) => {
          const value = display(d.field)
          const filled = value.trim() !== ''
          if (filled) {
            return (
              <div key={d.key} className="text-sm">
                <span className="text-muted-foreground">{d.label}: </span>
                <span className="font-medium">{value}</span>
              </div>
            )
          }
          return (
            <div key={d.key} className="flex flex-col gap-1">
              <label
                htmlFor={`f-${d.key}`}
                className="text-xs text-muted-foreground"
              >
                {d.label}
                {d.required && <span className="text-red-600"> *</span>}
              </label>
              <Input
                id={`f-${d.key}`}
                defaultValue=""
                aria-invalid={d.required || undefined}
                className={d.required ? 'border-red-500' : undefined}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v) setContent((c) => setDirective(c, d.key, v))
                }}
              />
            </div>
          )
        })}
        {state?.errors && (
          <p className="text-sm text-red-600">
            {Object.values(state.errors).flat()[0]}
          </p>
        )}
        <Button type="submit" disabled={pending || missingRequired}>
          {pending ? 'Salvando…' : submitLabel}
        </Button>
      </aside>
    </form>
  )
}
