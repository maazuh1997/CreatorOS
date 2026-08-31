'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const platforms = { Instagram: { icon: '◎' }, Facebook: { icon: 'f' }, LinkedIn: { icon: 'in' }, TikTok: { icon: '♪' }, YouTube: { icon: '▶' }, X: { icon: '𝕏' } }

export default function PublishClient() {
  const params = useSearchParams()
  const [payload, setPayload] = useState(null)
  const [copied, setCopied] = useState(false)
  const platform = params.get('platform') || 'Instagram'
  const config = platforms[platform] || platforms.Instagram
  useEffect(() => {
    try {
      const publish = JSON.parse(sessionStorage.getItem('creatoros_publish') || 'null')
      const media = JSON.parse(sessionStorage.getItem('creatoros_selected_media') || localStorage.getItem('creatoros_selected_media') || 'null')
      const fallback = JSON.parse(localStorage.getItem('creatoros_publish') || 'null')
      setPayload(publish || fallback ? { ...(fallback || {}), ...(publish || {}), media: publish?.media || fallback?.media || media } : null)
    } catch { setPayload(null) }
  }, [])
  const item = payload?.item || {}
  const hashtags = item.hashtags || payload?.hashtags || []
  const caption = `${item.caption || ''}${hashtags.length ? `\n\n${hashtags.join(' ')}` : ''}`
  const media = payload?.media || null
  const mediaUrl = media?.mediaUrl || media?.url || media?.src?.large2x || media?.src?.large || media?.src?.original || media?.image || media?.files?.find(file => file.width >= 720)?.link || null
  const mediaType = media?.type || 'photo'
  function copy() { navigator.clipboard?.writeText(caption); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  function openPlatform() { const urls = { Instagram: 'https://www.instagram.com/', Facebook: 'https://www.facebook.com/', LinkedIn: 'https://www.linkedin.com/feed/', TikTok: 'https://www.tiktok.com/', YouTube: 'https://studio.youtube.com/', X: 'https://x.com/' }; window.open(urls[platform], '_blank', 'noopener,noreferrer') }
  return <main className="publish-shell"><header className="publish-nav"><button onClick={() => window.history.back()}>← CreatorOS</button><div className="publish-brand">CREATOR<span>OS</span></div><div className="publish-platform"><b>{config.icon}</b>{platform}</div></header><section className="publish-wrap"><div className="publish-intro"><div><div className="publish-eyebrow">PUBLISH WORKSPACE</div><h1>Review your {platform} post.</h1><p>Everything below is generated from your campaign. Verify the creative, then continue to {platform} when you're ready.</p></div><div className="publish-status"><i>✓</i> Ready for review</div></div><div className="publish-grid"><section className={`social-preview ${platform.toLowerCase()}`}><div className="social-head"><div className="avatar">{(payload?.brand || 'C').slice(0,1).toUpperCase()}</div><div><strong>{payload?.brand || 'Your brand'}</strong><span>{platform === 'LinkedIn' ? 'Company · CreatorOS' : '@yourbrand'}</span></div><button>•••</button></div>{mediaUrl ? <div className="social-media">{mediaType === 'video' ? <video src={mediaUrl} controls playsInline /> : <img src={mediaUrl} alt={item.title || 'Campaign visual'} />}</div> : <div className="social-media social-placeholder"><span>✦</span><p>No visual selected</p><small>Return to Media Studio to choose a photo or video.</small></div>}<div className="social-body"><div className="social-actions"><span>♡</span><span>◯</span><span>⌁</span><span>▱</span></div><strong>{item.title || 'Campaign post'}</strong><p>{caption || 'No generated caption was found for this concept.'}</p></div></section><aside className="publish-side"><div className="side-card"><div className="side-label">CONTENT CHECK</div><h2>Ready to upload?</h2><div className="check"><span>{caption ? '✓' : '!'}</span><div><b>Generated copy</b><small>{caption ? 'Caption and hashtags loaded' : 'No caption found'}</small></div></div><div className="check"><span>{mediaUrl ? '✓' : '!'}</span><div><b>Campaign visual</b><small>{mediaUrl ? `${mediaType === 'video' ? 'Video' : 'Photo'} selected` : 'No media selected'}</small></div></div><div className="check"><span>✓</span><div><b>Platform</b><small>Optimized for {platform}</small></div></div><div className="side-divider"></div><button className="side-copy" onClick={copy} disabled={!caption}>{copied ? 'Copied ✓' : 'Copy caption'}</button><button className="side-upload" onClick={openPlatform}>Continue to {platform} ↗</button><p className="side-note">CreatorOS never publishes without your confirmation. You'll complete the final upload on {platform}.</p></div></aside></div></section></main>
}
