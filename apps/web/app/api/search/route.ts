import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { message: 'Docs search is handled by the static docs search index.' },
    { status: 404 }
  )
}
