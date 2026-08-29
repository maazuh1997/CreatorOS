import { MongoClient } from 'mongodb'

let clientPromise

export async function getDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not configured')
  if (!clientPromise) {
    const client = new MongoClient(uri)
    if (process.env.NODE_ENV === 'development') {
      global._mongoClientPromise = global._mongoClientPromise || client.connect()
      clientPromise = global._mongoClientPromise
    } else {
      clientPromise = client.connect()
    }
  }
  const client = await clientPromise
  return client.db(process.env.MONGODB_DB || 'creatoros')
}
