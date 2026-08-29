import { getDb } from './mongodb'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function checkAndConsumeGeneration(user) {
  const unlimited = Boolean(user?.freeAccess)
  if (unlimited) return { allowed: true, unlimited: true, used: null, limit: null }

  const db = await getDb()
  const date = todayKey()
  try {
    const result = await db.collection('usage').findOneAndUpdate(
      { userId: user._id, date, count: { $lt: 1 } },
      { $inc: { count: 1 }, $setOnInsert: { userId: user._id, date } },
      { upsert: true, returnDocument: 'after' }
    )
    if (!result) return { allowed: false, unlimited: false, used: 1, limit: 1 }
    return { allowed: true, unlimited: false, used: result.count, limit: 1 }
  } catch (error) {
    if (error?.code === 11000) return { allowed: false, unlimited: false, used: 1, limit: 1 }
    throw error
  }
}
