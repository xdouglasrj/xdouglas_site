import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { NextResponse } from 'next/server'

import { mediaFiles } from '../../portfolio-data'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const filename = mediaFiles.get(id)
  if (!filename) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  try {
    const image = await readFile(join(process.cwd(), 'public', 'ian-raposo-media', filename))
    return new NextResponse(new Uint8Array(image), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
        ETag: `"${id}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Image temporarily unavailable' }, { status: 502 })
  }
}
