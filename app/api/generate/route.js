import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/mongodb'
import { requireUser } from '../../../lib/auth'
import { checkAndConsumeGeneration } from '../../../lib/usage'

const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash'

async function generateWithGemini(input) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured')
  const prompt = `You are the senior creative strategist and copy director for CreatorOS. Produce work that could realistically be approved by a professional brand, agency or creator team. Do not write generic AI marketing copy. Think through the audience tension, desired behavioral change, brand differentiation, platform behavior and strongest creative territory before writing.\n\nCreate exactly five substantially different campaign concepts. Use five different mechanisms: insight/education, contrarian point of view, practical framework, narrative/storytelling, and proof/social evidence. Do not rewrite the same idea five times. Avoid empty phrases such as unlock your potential, take your content to the next level, game changer, and in today's fast-paced world. Never invent statistics, customer results, testimonials or product capabilities. If evidence is not supplied, make the claim qualitative.\n\nFor every concept write a specific hook, polished publish-ready caption, clear CTA, platform-native adaptation, visual direction, image-generation prompt and short-form video concept. Captions should sound human and editorial, with varied sentence rhythm and a clear point of view. The creative must be specific to this brand and brief.\n\nReturn ONLY valid JSON with this exact shape: {"strategy":"string","rationale":"string","audienceInsight":"string","contentPillars":["string","string","string","string","string"],"hashtags":["string"],"concepts:[{"title":"string","angle":"string","contentType":"string","mechanism":"string","platformAdaptation":"string","hook":"string","caption":"string","cta":"string","visual":"string","visualSearch":"string","imagePrompt":"string","videoConcept":"string","score":8.5}]}\n\nBrief: ${input.topic}\nPlatform: ${input.platform}\nContent type: ${input.contentType || 'Social post'}\nObjective: ${input.objective}\nAudience: ${input.audience || 'not specified'}\nBrand: ${input.brandName || 'not specified'}\nBrand voice: ${input.brandVoice || 'confident, human and clear'}\nBrand context: ${input.brandBio || 'not specified'}\nPositioning: ${input.positioning || 'not specified'}\nProducts/services: ${input.products || 'not specified'}\nRequested angle: ${input.selectedAngle || 'Strategic'}\nTone: ${input.tone || 'Confident'}`
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({ model, input: prompt, store: false })
  })
  const text = await response.text()
  let data
  try { data = JSON.parse(text) } catch { throw new Error(`Gemini returned an invalid response (${response.status})`) }
  if (!response.ok) throw new Error(data?.error?.message || `Gemini returned ${response.status}`)
  const output = data?.output_text || data?.steps?.filter(step => step.type === 'model_output').flatMap(step => step.content || []).filter(item => item.type === 'text').map(item => item.text || '').join('') || ''
  if (!output) throw new Error('Gemini returned an empty response')
  const cleaned = output.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  const result = JSON.parse(cleaned)
  if (!Array.isArray(result.concepts) || result.concepts.length !== 5) throw new Error('Gemini returned an incomplete campaign')
  return result
}

export async function POST(request) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  try {
    const input = await request.json()
    if (!input.topic?.trim()) return NextResponse.json({ error: 'Topic is required.' }, { status: 400 })
    const usage = await checkAndConsumeGeneration(auth.user)
    if (!usage.allowed) return NextResponse.json({ error: 'Daily generation limit reached.', used: usage.used, limit: usage.limit }, { status: 429 })
    const result = await generateWithGemini(input)
    result.concepts = result.concepts.map(item => ({ ...item, score: Math.min(10, Math.max(0, Number(item.score) || 8.5)) }))
    await (await getDb()).collection('generationEvents').insertOne({ userId: auth.user._id.toString(), email: auth.user.email, date: new Date().toISOString().slice(0, 10), createdAt: new Date(), provider: 'gemini', model, topic: input.topic, platform: input.platform, objective: input.objective, contentType: input.contentType || 'Social post', conceptCount: result.concepts.length })
    return NextResponse.json({ ...result, usage, provider: 'gemini', model })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}
