'use client'

import { useState } from 'react'

const types = ['photo', 'video']

export default function MediaStudio({ concept, platform }) {
  const [type, setType] = useState('photo')
  const [query, setQuery] = useState(concept?.visualSearch || concept?.title || '')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [saved, setSaved] = useState(null)

  async function search() {
    if (!query.trim()) return
    setLoading(true); setError('')
    try {
      const response = await fetch(`/api/media?type=${type}&platform=${encodeURIComponent(platform)}&query=${encodeURIComponent(query)}`)
      const text = await response.text()
      let data
      try { data = JSON.parse(text) } catch { throw new Error(`Media service returned an invalid response (${response.status}).`) }
      if (!response.ok) throw new Error(data.error || 'Media search failed')
      setItems(data.items || [])
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  function changeType(next) { setType(next); setItems([]); setError(''); setSelected(null) }
  function mediaUrl(item) { return type === 'photo' ? item.src?.large2x || item.src?.large || item.src?.original : item.files?.find(file => file.width >= 720)?.link || item.files?.[0]?.link }
  function selectAsset(item) { const asset = { ...item, type, mediaUrl: mediaUrl(item), selectedFor: platform, selectedAt: new Date().toISOString() }; setSaved(item.id); setSelected(item); sessionStorage.setItem('creatoros_selected_media', JSON.stringify(asset)); setTimeout(() => setSaved(null), 1800) }

  return <>
    <div className="media-studio">
      <div className="media-head">
        <div><span>MEDIA STUDIO</span><p>Source a visual that fits this creative direction.</p></div>
        <div className="media-tabs">{types.map(x => <button key={x} className={type === x ? 'active' : ''} onClick={() => changeType(x)}>{x === 'photo' ? 'Photos' : 'Videos'}</button>)}</div>
      </div>
      <div className="media-search"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search visual direction" onKeyDown={e => { if (e.key === 'Enter') search() }} /><button onClick={search} disabled={loading}>{loading ? 'Searching…' : 'Search'}</button></div>
      {error && <div className="media-error">{error}</div>}
      {!items.length && !loading && !error && <div className="media-empty"><span>✦</span><div><strong>Find a visual for this concept</strong><p>Search Pexels for professional photography or video.</p></div><button onClick={search}>Find {type === 'photo' ? 'photos' : 'videos'} →</button></div>}
      {loading && <div className="media-loading"><i></i><i></i><i></i></div>}
      {items.length > 0 && <div className={`media-grid ${type}`}>{items.map(item => <button className={`media-item ${saved === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelected(item)}>{type === 'photo' ? <img src={item.src?.large || item.src?.medium || item.src?.original} alt={item.alt || concept?.title || ''} /> : <div className="video-thumb"><img src={item.image} alt="" /><span>▶</span></div>}<div className="media-meta"><span>{type === 'photo' ? item.photographer : `${item.duration || 0}s video`}</span><b>{saved === item.id ? 'Selected ✓' : 'Preview'}</b></div></button>)}</div>}
      {items.length > 0 && <button className="media-refine" onClick={search}>Refresh results</button>}
    </div>
    {selected && <div className="media-lightbox" onClick={() => setSelected(null)}><div className="media-preview" onClick={e => e.stopPropagation()}><div className="preview-top"><span>{type === 'photo' ? 'PHOTO PREVIEW' : 'VIDEO PREVIEW'}</span><button onClick={() => setSelected(null)}>×</button></div>{type === 'photo' ? <img className="preview-image" src={mediaUrl(selected)} alt={selected.alt || concept?.title || ''} /> : <video className="preview-video" src={mediaUrl(selected)} poster={selected.image} controls autoPlay playsInline /> }<div className="preview-footer"><div><strong>{type === 'photo' ? selected.photographer : `${selected.duration || 0}s Pexels video`}</strong><span>Selected for {platform}</span></div><div className="preview-actions"><button onClick={() => selectAsset(selected)}>{saved === selected.id ? 'Selected ✓' : 'Use this asset'}</button><a href={mediaUrl(selected)} download target="_blank" rel="noreferrer">Download</a><a href={selected.url} target="_blank" rel="noreferrer">Source ↗</a></div></div></div></div>}
  </>
}
