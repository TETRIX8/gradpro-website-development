import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']
const DOC_TYPES = ['application/pdf', 'application/zip', 'text/plain', ...IMAGE_TYPES]
const MAX_BYTES = 15 * 1024 * 1024

/**
 * Two upload scopes:
 *  - scope=media  → admin only, images for covers/galleries
 *  - scope=brief  → public, attachments from the contact form (pdf/zip/images)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const scope = (formData.get('scope') as string) || 'media'

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Файл больше 15 МБ' }, { status: 413 })
    }

    if (scope === 'media') {
      const session = await auth.api.getSession({ headers: request.headers })
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (!IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Только изображения' }, { status: 415 })
      }
    } else if (!DOC_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Допустимы PDF, ZIP или изображения' }, { status: 415 })
    }

    const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(-80)
    const blob = await put(`${scope}/${Date.now()}-${safeName}`, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Загрузка не удалась' }, { status: 500 })
  }
}
