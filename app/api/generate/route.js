import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/mongodb'
import { requireUser } from '../../../lib/auth'
import { checkAndConsumeGeneration } from '../../../lib/usage'

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

const schema = {
  type: 'object',
  properties: {
    strategy: { type: 'string' },
    rationale: { type: 'string' },
    audienceInsight: { type: 'string' },
    contentPillars: { type: 'array', items: { type: 'string' }, minItems: 5, maxItems: 5 },
    hashtags: { type: 'array', items: { type: 'string' }, minItems: 5, maxItems: 12 },
    concepts: {
      type: 'array', minItems: 5, maxItems: 5,
      items: { type: 'object', properties: {
        title: { type: 'string' }, angle: { type: 'string' }, contentType: { type: 'string' }, mechanism: { type: 'string' }, platformAdaptation: { type: 'string' }, hook: { type: 'string' }, caption: { type: 'string' }, cta: { type: 'string' }, visual: { type: 'string' }, visualSearch: { type: 'string' }, imagePrompt: { type: 'string' }, videoConcept: { type: 'string' }, score: { type: 'number' }
      }, required: ['title','angle','contentType','mechanism','platformAdaptation','hook','caption','cta','visual','visualSearch','imagePrompt','videoConcept','score'] }
    }
  },
  required: ['strategy','rationale','audienceInsight','contentPillars','hashtags','concepts']
}

async function generateWithGemini(input) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured')
  const prompt = `You are the senior creative strategist and copy director for CreatorOS. Produce work that could realistically be approved by a professional brand, agency or creator team. Do not write generic AI marketing copy. Think before writing: identify the audience tension, desired behavioral change, brand differentiation, platform behavior and the strongest creative territory.\n\nCreate exactly five substantially different campaign concepts. Each concept must use a different creative mechanism: insight/education, contrarian point of view, practical framework, narrative/storytelling, and proof/social evidence. Do not merely rewrite the same idea. Avoid empty phrases such as 'unlock your potential', 'take your content to the next level', 'game changer', 'in today's fast-paced world', and similar filler. Never invent statistics, customer results, testimonials or product capabilities. If evidence is not supplied, make the claim qualitative.\n\nFor every concept write a strong specific hook, polished publish-ready caption, clear CTA, platform-native adaptation, visual direction, image-generation prompt and short-form video concept. Captions should sound human and editorial, with varied sentence rhythm and a clear point of view. The creative should be specific to the supplied brief, not interchangeable with another brand.\n\nBrief: ${input.topic}\nPlatform: ${input.platform}\nContent type: ${input.contentType || 'Social post'}\nObjective: ${input.objective}\nAudience: ${input.audience || 'not specified'}\nBrand: ${input.brandName || 'not specified'}\nBrand voice: ${input.brandVoice || 'confident, human and clear'}\nBrand context: ${input.brandBio || 'not specified'}\nPositioning: ${input.positioning || 'not specified'}\nProducts/services: ${input.products || 'not specified'}\nRequested angle: ${input.selectedAngle || 'Strategic'}\nTone: ${input.tone || 'Confident'}\n\nReturn only JSON matching the supplied schema.`
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.85, responseMimeType: 'application/json', responseSchema: schema } })
  })
  const text = await response.text()
  let data
  try { data = JSON.parse(text) } catch { throw new Error(`Gemini returned an invalid response (${response.status})`) }
  if (!response.ok) throw new Error(data?.error?.message || `Gemini returned ${response.status}`)
  const output = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || ''
  if (!output) throw new Error('Gemini returned an empty response')
  const result = JSON.parse(output)
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
