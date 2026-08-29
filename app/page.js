'use client'

import { useEffect, useState } from 'react'

const platforms = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'X']

export default function Home() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [audience, setAudience] = useState('')
  const [objective, setObjective] = useState('Grow engagement')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [usage, setUsage] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [users, setUsers] = useState([])
  const [adminError, setAdminError] = useState('')

  useEffect(() => {
    Promise.all([fetch('/api/auth').then(r => r.ok ? r.json() : null), fetch('/api/usage').then(r => r.ok ? r.json() : null)]).then(([auth, usageData]) => { setUser(auth?.user || null); setUsage(usageData || null) }).catch(() => {})
  }, [])

  async function generate() {
    if (!topic.trim()) return
    if (!user) { setError('Please sign in before generating content.'); return }
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, platform, audience, objective }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Generation failed')
      setResult(data)
      setUsage(data.usage || usage)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  async function copy(value) { await navigator.clipboard?.writeText(value || '') }
  function openPlatform(name, item) {
    if (item?.caption) copy(`${item.caption}\n\n${(item.hashtags || []).join(' ')}`)
    const urls = { Instagram: 'https://www.instagram.com/', Facebook: 'https://www.facebook.com/', LinkedIn: 'https://www.linkedin.com/feed/', TikTok: 'https://www.tiktok.com/', YouTube: 'https://www.youtube.com/', X: 'https://x.com/' }
    window.open(urls[name], '_blank', 'noopener,noreferrer')
  }

  async function openAdmin() {
    setShowAdmin(true); setAdminError('')
    const response = await fetch('/api/admin/users')
    const data = await response.json()
    if (!response.ok) { setAdminError(data.error || 'Unable to load users'); return }
    setUsers(data.users || [])
  }

  async function toggleFreeAccess(target) {
    const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: target._id, freeAccess: !target.freeAccess }) })
    const data = await response.json()
    if (!response.ok) { setAdminError(data.error || 'Unable to update access'); return }
    setUsers(items => items.map(item => item._id === target._id ? { ...item, freeAccess: data.freeAccess } : item))
  }

  return <main className="shell">
    <nav className="nav"><div className="logo">CREATOR<span>OS</span></div><div className="nav-note">AI creative workspace</div><div className="nav-actions">{user?.email && <span className="user-pill">{user.email}</span>}{user?.isAdmin && <button onClick={openAdmin}>Admin</button>}</div></nav>
    <section className="hero"><div className="eyebrow">CREATIVE INTELLIGENCE</div><h1>Create content<br /><em>brands can use.</em></h1><p>Turn one brief into professional campaign concepts, platform-native copy, visual direction and ready-to-share assets.</p></section>
    <section className="workspace">
      <aside className="brief card"><div className="section-label">01 · CREATIVE BRIEF</div><label>What are you creating?</label><textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Launch campaign for our new productivity app" />
        <label>Audience</label><input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. startup founders" />
        <label>Primary platform</label><select value={platform} onChange={e => setPlatform(e.target.value)}>{platforms.map(x => <option key={x}>{x}</option>)}</select>
        <label>Objective</label><select value={objective} onChange={e => setObjective(e.target.value)}><option>Grow engagement</option><option>Build awareness</option><option>Drive leads</option><option>Educate the audience</option><option>Promote a product</option></select>
        <button className="primary" onClick={generate} disabled={loading}>{loading ? 'Creating…' : 'Generate campaign'}</button>{user && <div className="usage-pill">{usage?.unlimited ? 'Unlimited access' : `${usage?.used || 0}/1 generation used today`}</div>}{error && <div className="error">{error}</div>}
      </aside>
      <section className="results"><div className="section-label">02 · CREATIVE DIRECTIONS</div>{!result ? <div className="empty card"><div className="empty-mark">✦</div><h2>Your campaign starts here.</h2><p>Enter a brief and CreatorOS will build distinct creative routes instead of repeating the same generic post.</p></div> : <><div className="strategy card"><span>STRATEGY</span><h2>{result.strategy}</h2><p>{result.brandGuidance || 'Built around differentiated creative mechanisms and platform-native execution.'}</p></div><div className="concepts">{(result.concepts || []).map((item, i) => <article className="concept card" key={i}><div className="concept-top"><span>0{i + 1}</span><b>{item.angle}</b><strong>{item.score}/10</strong></div><h2>{item.title}</h2><div className="hook">“{item.hook}”</div><p>{item.caption}</p><div className="meta"><span>CTA · {item.cta}</span><button onClick={() => copy(item.caption)}>Copy</button></div><div className="visual"><span>VISUAL DIRECTION</span><p>{item.visual}</p></div><div className="share"><span>Publish manually</span>{platforms.map(x => <button key={x} onClick={() => openPlatform(x, item)}>{x}</button>)}</div></article>)}</div></>}</section>
    </section>
    {showAdmin && <div className="modal-backdrop" onClick={() => setShowAdmin(false)}><section className="admin-modal card" onClick={e => e.stopPropagation()}><div className="admin-head"><div><div className="section-label">ADMIN</div><h2>User access</h2></div><button onClick={() => setShowAdmin(false)}>Close</button></div>{adminError && <div className="error">{adminError}</div>}<div className="admin-list">{users.map(item => <div className="admin-user" key={item._id}><div><strong>{item.email}</strong><span>{item.freeAccess ? 'Unlimited access' : '1 generation / day'}</span></div><button onClick={() => toggleFreeAccess(item)}>{item.freeAccess ? 'Remove Free' : 'Grant Free'}</button></div>)}</div></section></div>}
  </main>
}
