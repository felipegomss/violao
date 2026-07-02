'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function createRepertoire(formData: FormData) {
  await verifySession()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const rep = await prisma.repertoire.create({ data: { name } })
  revalidatePath('/repertorios')
  redirect(`/repertorios/${rep.id}`)
}

export async function renameRepertoire(id: string, formData: FormData) {
  await verifySession()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  await prisma.repertoire.update({ where: { id }, data: { name } })
  revalidatePath('/repertorios')
  revalidatePath(`/repertorios/${id}`)
}

export async function deleteRepertoire(id: string) {
  await verifySession()
  await prisma.repertoire.delete({ where: { id } })
  revalidatePath('/repertorios')
  redirect('/repertorios')
}

export async function addSongToRepertoire(repertoireId: string, songId: string) {
  await verifySession()
  const max = await prisma.repertoireSong.aggregate({
    where: { repertoireId },
    _max: { order: true },
  })
  const order = (max._max.order ?? 0) + 1
  await prisma.repertoireSong.upsert({
    where: { repertoireId_songId: { repertoireId, songId } },
    create: { repertoireId, songId, order },
    update: {},
  })
  revalidatePath(`/repertorios/${repertoireId}`)
}

export async function removeSongFromRepertoire(repertoireId: string, songId: string) {
  await verifySession()
  await prisma.repertoireSong.delete({
    where: { repertoireId_songId: { repertoireId, songId } },
  })
  revalidatePath(`/repertorios/${repertoireId}`)
}

export async function reorderRepertoireSongs(
  repertoireId: string,
  orderedSongIds: string[],
) {
  await verifySession()
  await prisma.$transaction(
    orderedSongIds.map((songId, i) =>
      prisma.repertoireSong.update({
        where: { repertoireId_songId: { repertoireId, songId } },
        data: { order: i + 1 },
      }),
    ),
  )
  revalidatePath(`/repertorios/${repertoireId}`)
}
