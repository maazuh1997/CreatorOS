import { NextResponse } from 'next'

export async function GET() {
  return NextResponse.json({ ok: true, service: 'creatoros' })
}
