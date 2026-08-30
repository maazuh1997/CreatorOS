'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const platforms = { Instagram: { label: 'Instagram', icon: '◎', action: 'Open Instagram' }, Facebook: { label: 'Facebook', icon: 'f', action: 'Open Facebook' }, LinkedIn: { label: 'LinkedIn', icon: 'in', action: 'Open LinkedIn' }, TikTok: { label: 'TikTok', icon: '♪', action: 'Open TikTok' }, YouTube: { label: 'YouTube', icon: '▶', action: 'Open YouTube' }, X: { label: 'X', icon: '𝕏', action: 'Open X' } }

export default function PublishClient() {
  const params = useSearchParams()
  const [payload, setPayload] = useState(null)
  const [verified, setVerified] = useState(false)
  const platform = params.get('platform') || 'Instagram'
  const config = platforms[platform] || platforms.Instagram

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('creatoros_publish')
      if (raw) setPayload(JSON.parse(raw))
    } catch {}
  }, [])

  const item = payload?.item || {}
  const hashtags = item.hashtags || payload?.hashtags || []
  const caption = `${item.caption || ''}${hashtags.length ? `\n\n${hashtags.join(' ')}` : ''}`
  const media = payload?.media || item.media || null
  const mediaUrl = media?.url || media?.src || media?.image || null
  const mediaType = media?.type || (media?.files ? 'video' : 'photo')

  function copy() { navigator.clipboard?.writeText(caption); setVerified(true) }
  function openPlatform() { const urls = { Instagram: 'https://www.instagram.com/', Facebook: 'https://www.facebook.com/', LinkedIn: 'https://www.linkedin.com/feed/', TikTok: 'https://www.tiktok.com/', YouTube: 'https://www.youtube.com/', X: 'https://x.com/' }; window.open(urls[platform], '_blank', 'noopener,noreferrer') }

  return <main className="publish-shell"><header className="publish-nav"><button onClick={() => window.history.back()}>← Back to CreatorOS</button><span>CREATOR<span>OS</span></span><div>{config.icon} {config.label}</div></header><section className="publish-wrap"><div className="publish-eyebrow">PUBLISH KIT · {config.label.toUpperCase()}</div><h1>Review before you publish.</h1><p className="publish-sub">CreatorOS prepared this post for {config.label}. Verify the copy and visual, then open the platform to publish it.</p><div className="publish-grid"><section className="publish-preview card"><div className="publish-card-head"><div><span>POST PREVIEW</span><h2>{item.title || 'Your generated post'}</h2></div><strong>{config.icon} {config.label}</strong></div>{mediaUrl && <div className="publish-media">{mediaType === 'video' ? <video src={mediaUrl} controls playsInline /> : <img src={mediaUrl} alt={item.title || 'Selected campaign visual'} />}</div>}<div className="publish-copy"><label>CAPTION</label><textarea value={caption} readOnly rows={10} /></div>{item.cta && <div className="publish-cta"><label>CALL TO ACTION</label><p>{item.cta}</p></div>}<div className="publish-actions"><button onClick={copy}>{verified ? 'Copied ✓' : 'Copy post'}</button><button className="primary" onClick={openPlatform}>{config.action} ↗</button></div></section><aside className="publish-check card"><span>FINAL CHECK</span><h2>Ready to publish?</h2><div className="check-row"><i>✓</i><div><b>Platform copy</b><p>Formatted for {config.label}</p></div></div><div className="check-row"><i>✓</i><div><b>Call to action</b><p>{item.cta || 'Included in the creative'}</p></div></div><div className="check-row"><i>✓</i><div><b>Visual direction</b><p>{item.visual || 'Use the selected campaign visual'}</p></div></div><div className="publish-note">CreatorOS does not post without your confirmation. Review everything on the platform before clicking its final publish button.</div></aside></div></section></main>
}
