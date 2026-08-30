import { NextResponse } from 'next/server'
import { requireUser } from '../../../lib/auth'

function orientationFor(platform, type) {
  if (type === 'video') return ['TikTok', 'Instagram', 'YouTube Shorts'].includes(platform) ? 'portrait' : platform === 'YouTube' ? 'landscape' : 'portrait'
  return platform === 'Instagram' || platform === 'TikTok' ? 'portrait' : platform === 'YouTube' ? 'landscape' : 'landscape'
}

export async function GET(request) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  if (!process.env.PEXELS_API_KEY) return NextResponse.json({ error: 'PEXELS_API_KEY is not configured' }, { status: 503 })
  const { searchParams } = new URL(request.url)
  const query = String(searchParams.get('query') || '').trim()
  const type = searchParams.get('type') === 'video' ? 'video' : 'photo'
  const platform = searchParams.get('platform') || 'Instagram'
  if (!query) return NextResponse.json({ error: 'Media search query is required.' }, { status: 400 })
  const orientation = orientationFor(platform, type)
  const endpoint = type === 'video' ? 'https://api.pexels.com/v1/videos/search' : 'https://api.pexels.com/v1/search'
  const response = await fetch(`${endpoint}?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=8`, { headers: { Authorization: process.env.PEXELS_API_KEY } })
  const text = await response.text()
  let data
  try { data = JSON.parse(text) } catch { return NextResponse.json({ error: `Pexels returned an invalid response (${response.status})` }, { status: 502 }) }
  if (!response.ok) return NextResponse.json({ error: data?.error || `Pexels returned ${response.status}` }, { status: response.status })
  if (type === 'video') {
    return NextResponse.json({ type, query, items: (data.videos || []).map(video => ({ id: video.id, url: video.url, image: video.image, width: video.width, height: video.height, duration: video.duration, files: (video.video_files || []).map(file => ({ link: file.link, quality: file.quality, width: file.width, height: file.height, fileType: file.file_type })) })) })
  }
  return NextResponse.json({ type, query, items: (data.photos || []).map(photo => ({ id: photo.id, url: photo.url, photographer: photo.photographer, photographerUrl: photo.photographer_url, alt: photo.alt, width: photo.width, height: photo.height, src: photo.src })) })
}
