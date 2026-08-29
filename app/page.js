'use client'

import { useState } from 'react'

const platforms = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'X']

export default function Home() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [audience, setAudience] = useState('')
  const [objective, setObjective] = useState('Grow engagement')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function generate() {
    if (!topic.trim()) return
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, platform, audience, objective }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Generation failed')
      setResult(data)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  async function copy(value) { await navigator.clipboard?.writeText(value || '') }
  function openPlatform(name) {
    const urls = { Instagram: 'https://www.instagram.com/', Facebook: 'https://www.facebook.com/', LinkedIn: 'https://www.linkedin.com/feed/', TikTok: 'https://www.tiktok.com/', YouTube: 'https://www.youtube.com/', X: 'https://x.com/' }
    if (result?.caption) copy(`${result.caption}\n\n${(result.hashtags || []).join(' ')}`)
    window.open(urls[name], '_blank', 'noopener,noreferrer')
  }

  return <main className="shell">
    <nav className="nav"><div className="logo">CREATOR<span>OS</span></div><div className="nav-note">AI creative workspace</div></nav>
    <section className="hero"><div className="eyebrow">CREATIVE INTELLIGENCE</div><h1>Create content<br /><em>brands can use.</em></h1><p>Turn one brief into professional campaign concepts, platform-native copy, visual direction and ready-to-share assets.</p></section>
    <section className="workspace">
      <aside className="brief card"><div className="section-label">01 · CREATIVE BRIEF</div><label>What are you creating?</label><textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Launch campaign for our new productivity app" />
        <label>Audience</label><input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. startup founders" />
        <label>Primary platform</label><select value={platform} onChange={e => setPlatform(e.target.value)}>{platforms.map(x => <option key={x}>{x}</option>)}</select>
        <label>Objective</label><select value={objective} onChange={e => setObjective(e.target.value)}><option>Grow engagement</option><option>Build awareness</option><option>Drive leads</option><option>Educate the audience</option><option>Promote a product</option></select>
        <button className="primary" onClick={generate} disabled={loading}>{loading ? 'Creating…' : 'Generate campaign'}</button>{error && <div className="error">{error}</div>}
      </aside>
      <section className="results"><div className="section-label">02 · CREATIVE DIRECTIONS</div>{!result ? <div className="empty card"><div className="empty-mark">✦</div><h2>Your campaign starts here.</h2><p>Enter a brief and CreatorOS will build distinct creative routes instead of repeating the same generic post.</p></div> : <><div className="strategy card"><span>STRATEGY</span><h2>{result.strategy}</h2><p>{result.brandGuidance || 'Built around differentiated creative mechanisms and platform-native execution.'}</p></div><div className="concepts">{(result.concepts || []).map((item, i) => <article className="concept card" key={i}><div className="concept-top"><span>0{i + 1}</span><b>{item.angle}</b><strong>{item.score}/10</strong></div><h2>{item.title}</h2><div className="hook">“{item.hook}”</div><p>{item.caption}</p><div className="meta"><span>CTA · {item.cta}</span><button onClick={() => copy(item.caption)}>Copy</button></div><div className="visual"><span>VISUAL DIRECTION</span><p>{item.visual}</p></div><div className="share"><span>Share this concept</span>{platforms.map(x => <button key={x} onClick={() => openPlatform(x)}>{x}</button>)}</div></article>)}</div></>}</section>
    </section>
  </main>
}
