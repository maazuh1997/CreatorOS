import { NextResponse } from 'next/server'
import { requireUser } from '../../../lib/auth'
import { checkAndConsumeGeneration } from '../../../lib/usage'

function fallback(input) {
  const topic = String(input.topic || '').trim()
  const platform = input.platform || 'Instagram'
  const audience = input.audience || 'your audience'
  const objective = input.objective || 'Grow engagement'
  const concepts = [
    { title: 'The overlooked insight', angle: 'Educational', hook: `${topic} gets easier when you stop starting with features and start with the outcome.`, caption: `Most conversations about ${topic} start in the wrong place.\n\nStart with what ${audience} is trying to accomplish, where the friction sits, and what a better outcome looks like.\n\nThat shift makes the message more useful and gives your brand a clearer point of view.`, cta: 'Save this framework for your next planning session.', visual: `Premium editorial campaign showing ${topic} as a credible solution, with refined composition and clear subject focus.`, score: 9.4 },
    { title: 'The myth worth challenging', angle: 'Contrarian', hook: `The popular advice about ${topic} sounds sensible. It can still lead teams in the wrong direction.`, caption: `The default playbook for ${topic} is not always the best one.\n\nAsk whether the approach actually moves ${audience} toward the outcome they care about.\n\nThat small change in thinking can make the strategy clearer and more differentiated.`, cta: 'Share your take on the conventional advice.', visual: `Bold conceptual campaign contrasting a crowded conventional path with a clear differentiated route around ${topic}.`, score: 9.1 },
    { title: 'The three-step playbook', angle: 'Problem / Solution', hook: `Before you act on ${topic}, run this three-part check.`, caption: `01 — Is the problem specific enough to matter?\n02 — Is the value obvious to the customer?\n03 — Is the next action easy to understand?\n\nIf one answer is unclear, tighten the message before adding more content.`, cta: 'Save this checklist.', visual: `Minimal premium checklist composition for ${topic}, generous negative space and modern brand styling.`, score: 9.6 },
    { title: 'The real-world story', angle: 'Storytelling', hook: `A simple moment around ${topic} can reveal what your audience actually needs.`, caption: `Good content earns attention by naming a problem people already recognize, showing a better path, and making the next step feel possible.\n\nThe strongest brand stories often start with everyday friction rather than a product claim.`, cta: 'Tell us where your audience feels the most friction.', visual: `Human-centered professional storytelling scene showing a realistic person solving a ${topic} problem, cinematic but credible.`, score: 9.0 },
    { title: 'Proof before promise', angle: 'Social proof', hook: `If you want people to believe in ${topic}, show the change—not just the claim.`, caption: `Strong ${topic} content does not need bigger promises. It needs clearer proof.\n\nShow the before. Explain the decision. Make the result concrete. Then give people enough context to judge whether the approach fits them.`, cta: 'Invite the audience to share a result or lesson.', visual: `Premium case-study composition for ${topic}, showing before-and-after context with restrained commercial design.`, score: 9.3 }
  ]
  return { strategy: `${objective} campaign for ${audience} on ${platform}, built around five distinct creative mechanisms.`, concepts }
}

async function generateWithGemini(input) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const prompt = `You are a senior brand strategist. Create exactly 5 distinct social campaign concepts as JSON. Topic: ${input.topic}. Audience: ${input.audience || 'general audience'}. Platform: ${input.platform || 'Instagram'}. Objective: ${input.objective || 'Grow engagement'}. Return {"strategy":"...","concepts":[{"title":"...","angle":"...","hook":"...","caption":"...","cta":"...","visual":"...","score":9.4}]} with no markdown.`
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) })
  if (!response.ok) throw new Error('Gemini request failed')
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.map(x => x.text || '').join('') || ''
  return JSON.parse(text.replace(/^```json\s*/,'').replace(/```$/,'').trim())
}

export async function POST(request) {
  try {
    const auth = await requireUser(request)
    if (auth.response) return auth.response
    const usage = await checkAndConsumeGeneration(auth.user)
    if (!usage.allowed) return NextResponse.json({ error: 'Daily generation limit reached.', used: usage.used, limit: usage.limit }, { status: 429 })
    const input = await request.json()
    if (!String(input.topic || '').trim()) return NextResponse.json({ error: 'Topic is required.' }, { status: 400 })
    let result
    try { result = await generateWithGemini(input) } catch { result = null }
    result = result || fallback(input)
    return NextResponse.json({ ...result, usage })
  } catch (error) { return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 }) }
}
