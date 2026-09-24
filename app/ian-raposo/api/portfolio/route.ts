import { NextResponse } from 'next/server'

import { editorial, institutions, works } from '../portfolio-data'

export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json({ works, institutions, editorial })
}
