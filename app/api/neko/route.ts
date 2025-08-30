import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hunger: 100,
    thirst: 100,
    cleanliness: 100,
    day_counter: 0,
  })
}


