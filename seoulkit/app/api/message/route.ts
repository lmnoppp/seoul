import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ items: [], nextCursor: null })
}

export async function POST() {
  return NextResponse.json({ id: 'TODO' })
}


