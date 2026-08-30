'use client'

import { useState } from 'react'

const types = ['photo', 'video']

export default function MediaStudio({ concept, platform }) {
  const [type, setType] = useState('photo')
  const [query, setQuery] = useState(concept?.visualSearch || concept?.title || '')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function search() {
    if (!query.trim()) return
    setLoading(true); setError('')
    try {
      const response = await fetch(`/api/media?type=${type}&platform=${encodeURIComponent(platform)}&query=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Media search failed')
      setItems(data.items || [])
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return <div className="media-studio">
    <div className="media-head"><div><span>MEDIA STUDIO</span><p>Find professional visual assets for this concept.</p></div><div className="media-tabs">{types.map(x => <button key={x} className={type === x ? 'active' : ''} onClick={() => { setType(x); setItems([]) }}>{x === 'photo' ? 'Photos' : 'Videos'}</button>)}</div></div>
    <div className="media-search"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search visual direction" onKeyDown={e => { if (e.key === 'Enter') search() }} /><button onClick={search} disabled={loading}>{loading ? 'Searching…' : 'Find media'}</button></div>
    {error && <div className="error">{error}</div>}
    {items.length > 0 && <div className={`media-grid ${type}`}>{items.map(item => <div className="media-item" key={item.id}>{type === 'photo' ? <img src={item.src?.medium || item.src?.large || item.src?.original} alt={item.alt || concept?.title || ''} /> : <video src={item.files?.find(file => file.width >= 720)?.link || item.files?.[0]?.link} poster={item.image} controls preload="metadata" /> }<div className="media-meta"><span>{type === 'photo' ? item.photographer : `${item.duration || 0}s video`}</span><a href={item.url} target="_blank" rel="noreferrer">Source</a></div></div>)}</div>}
  </div>
}
