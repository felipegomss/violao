'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ClipboardType, Link2 } from 'lucide-react'
import { importCifraClub } from '@/app/actions/import'
import type { SongFormState } from '@/app/actions/songs'
import { Btn } from '@/components/btn'
import { SongEditor } from '@/app/songs/song-editor'

type Action = (state: SongFormState, formData: FormData) => Promise<SongFormState>

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'
const INPUT =
  'h-11 w-full rounded-lg border border-ink/22 bg-folha px-3 font-cifra text-[14px] text-ink outline-none transition-colors duration-150 placeholder:text-[#a89e8d] focus:border-teal ' +
  FOCUS

export function NewSongFlow({ action, initialContent }: { action: Action; initialContent?: string }) {
  // Vindo de "adicionar ao acervo" (?from=) já entra no editor com a cifra.
  const [content, setContent] = useState<string | undefined>(initialContent)
  const [mode, setMode] = useState<'choose' | 'import' | 'edit'>(initialContent ? 'edit' : 'choose')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function runImport() {
    setError(null)
    setPending(true)
    const res = await importCifraClub(url.trim())
    setPending(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setContent(res.content)
    setMode('edit')
  }

  if (mode === 'edit') {
    return (
      <SongEditor
        key={content ?? 'new'}
        action={action}
        title="Nova música"
        backHref="/songs"
        submitLabel="Criar música"
        initialContent={content}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col px-8 pt-8">
      <div className="flex items-center gap-3.5">
        {mode === 'import' ? (
          <button
            type="button"
            onClick={() => setMode('choose')}
            aria-label="voltar"
            className={`flex h-11 w-11 items-center justify-center text-faint hover:text-ink ${FOCUS}`}
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
        ) : (
          <Link
            href="/songs"
            aria-label="voltar"
            className={`flex h-11 w-11 items-center justify-center text-faint hover:text-ink ${FOCUS}`}
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </Link>
        )}
        <h2 className="font-editorial text-[32px] font-semibold leading-none">Nova música</h2>
      </div>

      {mode === 'choose' ? (
        <div className="mt-10 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-start gap-4 rounded-xl border border-ink/16 bg-[#fbf7ee] p-5 text-left transition-colors duration-150 hover:border-ink/35 ${FOCUS}`}
          >
            <ClipboardType size={22} strokeWidth={1.75} className="mt-0.5 flex-none text-teal" />
            <span>
              <span className="block font-editorial text-[19px] font-semibold">Colar a cifra</span>
              <span className="mt-1 block font-editorial text-[15px] italic text-soft">
                Escreve ou cola no formato do app, com os acordes entre colchetes.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode('import')}
            className={`flex items-start gap-4 rounded-xl border border-ink/16 bg-[#fbf7ee] p-5 text-left transition-colors duration-150 hover:border-ink/35 ${FOCUS}`}
          >
            <Link2 size={22} strokeWidth={1.75} className="mt-0.5 flex-none text-teal" />
            <span>
              <span className="block font-editorial text-[19px] font-semibold">
                Importar do CifraClub
              </span>
              <span className="mt-1 block font-editorial text-[15px] italic text-soft">
                Cola o link da cifra e a gente converte pra você revisar.
              </span>
            </span>
          </button>
        </div>
      ) : (
        <div className="mt-10 max-w-[440px]">
          <label htmlFor="cc-url" className="mb-2 block font-cifra text-[11px] lowercase text-faint">
            link do CifraClub
          </label>
          <input
            id="cc-url"
            type="url"
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && url.trim() && !pending) runImport()
            }}
            placeholder="https://www.cifraclub.com.br/…"
            className={INPUT}
          />
          {error && (
            <p role="alert" className="mt-3 font-cifra text-[12px] text-rust">
              {error}
            </p>
          )}
          <div className="mt-6 flex items-center gap-3">
            <Btn type="button" onClick={runImport} disabled={pending || !url.trim()}>
              {pending ? 'Importando…' : 'Importar'}
            </Btn>
            <span className="font-editorial text-[14px] italic text-faint">
              você revisa antes de salvar
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
