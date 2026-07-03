'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { slugify, uniqueSlug } from '@/lib/slug'

// Liga o compartilhamento: gera um shareSlug opaco (se ainda não houver) e o
// devolve pro cliente montar o link. Idempotente — não regenera o link.
export async function shareRepertoire(id: string): Promise<string | null> {
  const { userId } = await verifySession()
  const rep = await prisma.repertoire.findFirst({ where: { id, userId } })
  if (!rep) return null
  if (rep.shareSlug) return rep.shareSlug
  const shareSlug = randomBytes(9).toString('base64url')
  await prisma.repertoire.update({ where: { id }, data: { shareSlug } })
  revalidatePath('/repertorios/[slug]', 'page')
  return shareSlug
}

// Desliga: mata o link (quem tiver a URL antiga perde o acesso).
export async function unshareRepertoire(id: string): Promise<void> {
  const { userId } = await verifySession()
  await prisma.repertoire.updateMany({ where: { id, userId }, data: { shareSlug: null } })
  revalidatePath('/repertorios/[slug]', 'page')
}

export async function createRepertoire(formData: FormData) {
  const { userId } = await verifySession()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const slug = await uniqueSlug(
    slugify(name),
    async (s) => (await prisma.repertoire.count({ where: { userId, slug: s } })) > 0,
  )
  const rep = await prisma.repertoire.create({ data: { name, userId, slug } })
  revalidatePath('/repertorios')
  redirect(`/repertorios/${rep.slug}`)
}

export async function renameRepertoire(id: string, formData: FormData) {
  const { userId } = await verifySession()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const { count } = await prisma.repertoire.updateMany({
    where: { id, userId },
    data: { name },
  })
  if (count === 0) return
  revalidatePath('/repertorios')
  revalidatePath('/repertorios/[slug]', 'page')
}

export async function deleteRepertoire(id: string) {
  const { userId } = await verifySession()
  await prisma.repertoire.deleteMany({ where: { id, userId } })
  revalidatePath('/repertorios')
  redirect('/repertorios')
}

export async function addSongToRepertoire(repertoireId: string, songId: string) {
  const { userId } = await verifySession()
  const rep = await prisma.repertoire.findFirst({ where: { id: repertoireId, userId } })
  if (!rep) return
  const song = await prisma.song.findFirst({ where: { id: songId, userId } })
  if (!song) return
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
  revalidatePath('/repertorios/[slug]', 'page')
}

export async function removeSongFromRepertoire(repertoireId: string, songId: string) {
  const { userId } = await verifySession()
  const rep = await prisma.repertoire.findFirst({ where: { id: repertoireId, userId } })
  if (!rep) return
  await prisma.repertoireSong.delete({
    where: { repertoireId_songId: { repertoireId, songId } },
  })
  revalidatePath('/repertorios/[slug]', 'page')
}

export async function reorderRepertoireSongs(
  repertoireId: string,
  orderedSongIds: string[],
) {
  const { userId } = await verifySession()
  const rep = await prisma.repertoire.findFirst({ where: { id: repertoireId, userId } })
  if (!rep) return
  await prisma.$transaction(
    orderedSongIds.map((songId, i) =>
      prisma.repertoireSong.update({
        where: { repertoireId_songId: { repertoireId, songId } },
        data: { order: i + 1 },
      }),
    ),
  )
  revalidatePath('/repertorios/[slug]', 'page')
}
