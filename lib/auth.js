import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { jwtVerify, SignJWT } from 'jose'
import { ObjectId } from 'mongodb'
import { getDb } from './mongodb'

function getSecret() {
  const secretValue = process.env.JWT_SECRET
  if (!secretValue) throw new Error('JWT_SECRET is not configured')
  return new TextEncoder().encode(secretValue)
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export async function createSession(user) {
  const token = await new SignJWT({ sub: user._id.toString(), email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
  return token
}

export async function getUser(request) {
  const token = request.cookies.get('creatoros_session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub) return null
    const db = await getDb()
    return db.collection('users').findOne({ _id: new ObjectId(payload.sub) }, { projection: { passwordHash: 0 } })
  } catch {
    return null
  }
}

export async function requireUser(request) {
  const user = await getUser(request)
  if (!user) return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
  return { user }
}

export function isAdmin(user) {
  return Boolean(user && process.env.ADMIN_EMAIL && user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase())
}

export function sessionCookie(token) {
  return {
    name: 'creatoros_session',
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  }
}
