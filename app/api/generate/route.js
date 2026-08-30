import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/mongodb'
import { requireUser } from '../../../lib/auth'
import { checkAndConsumeGeneration } from '../../../lib/usage'

function slugTag(value) { return String(value || '').replace(/[^a-z0-9]/gi, '') }

function fallback(input) {
  const topic = input.topic.trim()
  const brand = input.brandName || 'the brand'
  const audience = input.audience || 'target customers'
  const platform = input.platform
  const objective = input.objective
  const type = input.contentType || 'Social post'
  const concepts = [
    { title: 'The overlooked insight', angle: 'Educational', hook: `${topic} gets easier when you stop starting with the feature and start with the outcome.`, caption: `Most conversations about ${topic} start in the wrong place.\n\nInstead of asking what to add, ask what your audience is trying to accomplish and where the friction really sits.\n\nFor ${audience}, that shift turns ${topic} from another idea into a useful business decision.\n\nSave this framework for your next planning session.`, cta: 'Save this framework for later.', visual: `Premium editorial scene showing ${topic} as a credible business solution in a refined ${brand} environment.`, visualSearch: `${topic} professional business editorial`, score: 9.4 },
    { title: 'The myth worth challenging', angle: 'Contrarian', hook: `The popular advice about ${topic} sounds sensible. It can also lead teams in the wrong direction.`, caption: `The default playbook for ${topic} is not always the best one.\n\nThe better question is not whether everyone else is doing it. It is whether the approach moves your audience toward the outcome they actually care about.\n\nThat small change in thinking can make the strategy clearer, more differentiated, and easier to execute.`, cta: 'Share your take on the conventional advice.', visual: `Bold conceptual campaign image contrasting a crowded conventional path with a clear differentiated route around ${topic}.`, visualSearch: `${topic} strategy concept contrast`, score: 9.1 },
    { title: 'The three-step playbook', angle: 'Problem / Solution', hook: `Before you act on ${topic}, run this three-part check.`, caption: `Before investing more time in ${topic}, pressure-test the idea: \n\n01 — Is the problem specific enough to matter?\n02 — Is the value obvious to the customer?\n03 — Is the next action easy to understand?\n\nIf one answer is unclear, tighten the message before adding more content.`, cta: 'Save this checklist and use it before your next campaign.', visual: `Minimal premium checklist composition for ${topic}, crisp typography-safe layout, generous negative space and modern brand styling.`, visualSearch: `${topic} checklist minimal`, score: 9.6 },
    { title: 'The real-world story', angle: 'Storytelling', hook: `A simple moment around ${topic} can reveal what your audience actually needs.`, caption: `Picture the moment: someone is trying to make progress on ${topic}, but the process is slower and more confusing than it should be.\n\nThat is where good content earns attention. Not by adding noise, but by naming the friction, showing a better path, and making the next step feel possible.\n\nThe best brand stories often start with a problem people already recognize.`, cta: 'Tell us where your audience feels the most friction.', visual: `Human-centered storytelling scene showing a realistic professional solving a ${topic} problem, cinematic but credible, with subtle brand cues.`, visualSearch: `${topic} professional person workflow`, score: 9.0 },
    { title: 'Proof before promise', angle: 'Social proof', hook: `If you want people to believe in ${topic}, show the change—not just the claim.`, caption: `Strong ${topic} content does not need bigger promises. It needs clearer proof.\n\nShow the before. Explain the decision. Make the result concrete. Then give the audience enough context to judge whether the approach fits them.\n\nThat makes the content more credible and gives your brand something stronger than a headline: evidence.`, cta: 'Invite the audience to share a result or lesson.', visual: `Premium case-study style composition for ${topic}, showing before-and-after context with restrained commercial design and space for proof points.`, visualSearch: `${topic} case study results business`, score: 9.3 }
  ].map((item, index) => ({ ...item, contentType: type, mechanism: ['Teach an insight','Challenge a belief','Give a framework','Tell a human story','Demonstrate proof'][index], platformAdaptation: `${platform}-native ${type.toLowerCase()} designed for ${objective.toLowerCase()}.` }))
  return { strategy: `${objective} campaign for ${audience} on ${platform}, built around five distinct creative mechanisms instead of repeated copy variations.`, rationale: `Each route has a different job: educate, challenge, simplify, humanize or prove. Select the mechanism that best matches the audience's current state and your brand voice.`, audienceInsight: `The audience needs a clear reason to care about ${topic} and an easy next step that fits ${objective.toLowerCase()}.`, contentPillars: ['Insight', 'Point of view', 'Practical value', 'Human story', 'Proof'], concepts, hashtags: [`#${slugTag(topic) || 'Content'}`, `#${slugTag(platform)}`, '#ContentStrategy', '#SocialMediaMarketing', '#CreatorOS'] }
}

async function generateWithOllama(input) {
  const url = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
  const model = process.env.OLLAMA_MODEL || 'qwen2.5:7b'
  const system = `You are the senior social strategist inside CreatorOS. Create publish-ready content for a real brand. Return ONLY valid JSON. Build exactly 5 genuinely different creative concepts, not five rewrites of the same post. Use five different mechanisms such as teaching an insight, challenging a belief, giving a framework, telling a human story, and demonstrating proof. Tailor every concept to the platform, objective, audience, content type, brand voice and brand context. Avoid generic filler, fake statistics, unsupported claims, AI references and repetitive openings. Make the writing specific, commercially useful and ready for a professional brand team. Also create platform-native adaptation guidance and visual/video direction. JSON shape: {strategy:string,rationale:string,audienceInsight:string,contentPillars:string[],hashtags:string[],concepts:[{title:string,angle:string,contentType:string,mechanism:string,platformAdaptation:string,hook:string,caption:string,cta:string,visual:string,visualSearch:string,imagePrompt:string,videoConcept:string,score:number}]} `
  const userPrompt = `Brief: ${input.topic}\nPlatform: ${input.platform}\nContent type: ${input.contentType || 'Social post'}\nObjective: ${input.objective}\nAudience: ${input.audience}\nBrand: ${input.brandName || 'Unnamed brand'}\nBrand voice: ${input.brandVoice || 'confident and human'}\nBrand context: ${input.brandBio || 'not specified'}\nRequested angle: ${input.selectedAngle || 'choose five distinct mechanisms'}\nTone: ${input.tone || 'Confident'}`
  const response = await fetch(`${url.replace(/\/$/, '')}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, stream: false, format: 'json', messages: [{ role: 'system', content: system }, { role: 'user', content: userPrompt }] }) })
  if (!response.ok) throw new Error(`Ollama returned ${response.status}`)
  const data = await response.json()
  const parsed = JSON.parse(data.message?.content || '{}')
  if (!Array.isArray(parsed.concepts) || parsed.concepts.length < 5) throw new Error('Incomplete AI response')
  return parsed
}

export async function POST(request) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  try {
    const input = await request.json()
    if (!input.topic?.trim()) return NextResponse.json({ error: 'Topic is required.' }, { status: 400 })
    const usage = await checkAndConsumeGeneration(auth.user)
    if (!usage.allowed) return NextResponse.json({ error: 'Daily generation limit reached.', used: usage.used, limit: usage.limit }, { status: 429 })
    let result
    try { result = await generateWithOllama(input) } catch { result = fallback(input) }
    const fallbackResult = fallback(input)
    result = { ...fallbackResult, ...result }
    result.concepts = (Array.isArray(result.concepts) ? result.concepts : fallbackResult.concepts).slice(0, 5).map((item, i) => ({ ...fallbackResult.concepts[i], ...item, contentType: item.contentType || input.contentType || 'Social post', visualSearch: item.visualSearch || input.topic, score: Number(item.score || fallbackResult.concepts[i]?.score || 8.5), title: item.title || `Creative direction ${i + 1}`, angle: item.angle || fallbackResult.concepts[i]?.angle || 'Strategic', mechanism: item.mechanism || fallbackResult.concepts[i]?.mechanism, platformAdaptation: item.platformAdaptation || fallbackResult.concepts[i]?.platformAdaptation, imagePrompt: item.imagePrompt || item.visual, videoConcept: item.videoConcept || `Create a short-form visual story around ${item.hook || input.topic}, ending with: ${item.cta || 'a clear next step.'}` }))
    result.hashtags = Array.isArray(result.hashtags) ? result.hashtags.slice(0, 12) : fallbackResult.hashtags
    await (await getDb()).collection('generationEvents').insertOne({ userId: auth.user._id.toString(), email: auth.user.email, date: new Date().toISOString().slice(0, 10), createdAt: new Date(), provider: process.env.AI_PROVIDER || 'ollama', model: process.env.OLLAMA_MODEL || null, topic: input.topic, platform: input.platform, objective: input.objective, contentType: input.contentType || 'Social post', conceptCount: result.concepts.length })
    return NextResponse.json({ ...result, usage })
  } catch (error) { return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 }) }
}
