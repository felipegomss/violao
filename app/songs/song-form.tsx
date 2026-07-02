'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SONG_STATUS, CHORD_FORMAT } from '@/lib/validations/song'
import type { SongFormState } from '@/app/actions/songs'

type SongDefaults = {
  title?: string
  artist?: string
  key?: string
  genres?: string[]
  version?: string | null
  capo?: number | null
  tuning?: string
  bpm?: number | null
  difficulty?: number | null
  status?: string
  chordFormat?: string
  chordContent?: string
  referenceYoutubeUrl?: string | null
  notes?: string | null
}

type Action = (
  state: SongFormState,
  formData: FormData,
) => Promise<SongFormState>

function Field({
  label,
  htmlFor,
  errors,
  children,
}: {
  label: string
  htmlFor: string
  errors?: string[]
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {errors?.[0] && <p className="text-sm text-red-600">{errors[0]}</p>}
    </div>
  )
}

export function SongForm({
  action,
  defaults = {},
  submitLabel = 'Salvar',
}: {
  action: Action
  defaults?: SongDefaults
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState<SongFormState, FormData>(
    action,
    undefined,
  )
  const e = state?.errors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Título *" htmlFor="title" errors={e.title}>
          <Input id="title" name="title" defaultValue={defaults.title} required />
        </Field>
        <Field label="Artista *" htmlFor="artist" errors={e.artist}>
          <Input id="artist" name="artist" defaultValue={defaults.artist} required />
        </Field>
        <Field label="Tom *" htmlFor="key" errors={e.key}>
          <Input id="key" name="key" defaultValue={defaults.key} required />
        </Field>
        <Field label="Gêneros (separados por vírgula)" htmlFor="genres" errors={e.genres}>
          <Input id="genres" name="genres" defaultValue={defaults.genres?.join(', ')} />
        </Field>
        <Field label="Versão / arranjo" htmlFor="version" errors={e.version}>
          <Input id="version" name="version" defaultValue={defaults.version ?? ''} />
        </Field>
        <Field label="Capotraste (casa)" htmlFor="capo" errors={e.capo}>
          <Input id="capo" name="capo" type="number" min={0} max={12} defaultValue={defaults.capo ?? ''} />
        </Field>
        <Field label="Afinação" htmlFor="tuning" errors={e.tuning}>
          <Input id="tuning" name="tuning" defaultValue={defaults.tuning ?? 'standard'} />
        </Field>
        <Field label="BPM" htmlFor="bpm" errors={e.bpm}>
          <Input id="bpm" name="bpm" type="number" min={20} max={400} defaultValue={defaults.bpm ?? ''} />
        </Field>
        <Field label="Dificuldade (1–5)" htmlFor="difficulty" errors={e.difficulty}>
          <Input id="difficulty" name="difficulty" type="number" min={1} max={5} defaultValue={defaults.difficulty ?? ''} />
        </Field>
        <Field label="Status" htmlFor="status" errors={e.status}>
          <select
            id="status"
            name="status"
            defaultValue={defaults.status ?? 'APRENDENDO'}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {SONG_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Formato da cifra" htmlFor="chordFormat" errors={e.chordFormat}>
          <select
            id="chordFormat"
            name="chordFormat"
            defaultValue={defaults.chordFormat ?? 'TRADICIONAL'}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {CHORD_FORMAT.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Link YouTube (referência)" htmlFor="referenceYoutubeUrl" errors={e.referenceYoutubeUrl}>
          <Input id="referenceYoutubeUrl" name="referenceYoutubeUrl" defaultValue={defaults.referenceYoutubeUrl ?? ''} />
        </Field>
      </div>

      <Field label="Cifra (texto cru)" htmlFor="chordContent" errors={e.chordContent}>
        <Textarea id="chordContent" name="chordContent" rows={12} className="font-mono" defaultValue={defaults.chordContent} />
      </Field>
      <Field label="Anotações do professor" htmlFor="notes" errors={e.notes}>
        <Textarea id="notes" name="notes" rows={4} defaultValue={defaults.notes ?? ''} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
