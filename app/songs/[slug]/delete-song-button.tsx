'use client'

import { Button } from '@/components/ui/button'

export function DeleteSongButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            'Apagar esta música? Isso também remove gravações, sessões de prática e vínculos de repertório. Não dá pra desfazer.',
          )
        ) {
          e.preventDefault()
        }
      }}
    >
      <Button type="submit" variant="destructive">
        Apagar
      </Button>
    </form>
  )
}
