import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/mongodb'
import { hashPassword, verifyPassword, createSession, sessionCookie, getUser, isAdmin } from '../../../lib/auth'

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({ user: { id: user._id.toString(), email: user.email, adminFree: Boolean(user.adminFree), isAdmin: isAdmin(user) } })
}

export async function POST(request) {
  try {
    const { mode = 'signin', email, password } = await request.json()
    const normalized = String(email || '').trim().toLowerCase()
    if (!normalized || !password || password.length < 6) return NextResponse.json({ error: 'Enter a valid email and a password of at least 6 characters.' }, { status: 400 })
    const db = await getDb()
    const users = db.collection('users')
    let user = await users.findOne({ email: normalized })
    if (mode === 'signup') {
      if (user) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      const passwordHash = await hashPassword(password)
      const createdAt = new Date()
      const result = await users.insertOne({ email: normalized, passwordHash, adminFree: false, createdAt, updatedAt: createdAt })
      user = { _id: result.insertedId, email: normalized, adminFree: false }
    } else {
      if (!user || !(await verifyPassword(password, user.passwordHash))) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }
    const token = await createSession(user)
    const response = NextResponse.json({ user: { id: user._id.toString(), email: user.email, adminFree: Boolean(user.adminFree), isAdmin: isAdmin(user) } })
    response.cookies.set(sessionCookie(token))
    return response
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({ name: 'creatoros_session', value: '', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
  return response
}
