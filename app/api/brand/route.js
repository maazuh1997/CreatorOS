import { NextResponse } from 'next/server'
import { requireUser } from '../../../lib/auth'
import { getDb } from '../../../lib/mongodb'

export async function GET(request) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  const db = await getDb()
  const brand = await db.collection('brandPresets').findOne({ userId: auth.user._id })
  return NextResponse.json({ brand: brand || null })
}

export async function PUT(request) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  const body = await request.json()
  const brand = {
    userId: auth.user._id,
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    audience: String(body.audience || '').trim(),
    voice: String(body.voice || '').trim(),
    positioning: String(body.positioning || '').trim(),
    products: String(body.products || '').trim(),
    colors: Array.isArray(body.colors) ? body.colors.slice(0, 8).map(String) : [],
    updatedAt: new Date()
  }
  const db = await getDb()
  await db.collection('brandPresets').updateOne({ userId: auth.user._id }, { $set: brand, $setOnInsert: { createdAt: new Date() } }, { upsert: true })
  return NextResponse.json({ brand })
}
