import { NextResponse } from 'next/server'
import { isAdmin, requireUser } from '../../../../lib/auth'
import { getDb } from '../../../../lib/mongodb'

export async function GET(request) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  if (!isAdmin(auth.user)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const db = await getDb()
  const users = await db.collection('users').find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray()
  return NextResponse.json({ users })
}

export async function PATCH(request) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  if (!isAdmin(auth.user)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const body = await request.json()
  const userId = String(body.userId || '')
  if (!/^[a-fA-F0-9]{24}$/.test(userId)) return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 })
  if (typeof body.freeAccess !== 'boolean') return NextResponse.json({ error: 'freeAccess must be boolean' }, { status: 400 })
  const db = await getDb()
  const result = await db.collection('users').updateOne({ _id: new (await import('mongodb')).ObjectId(userId) }, { $set: { freeAccess: body.freeAccess, updatedAt: new Date() } })
  if (!result.matchedCount) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ ok: true, freeAccess: body.freeAccess })
}
