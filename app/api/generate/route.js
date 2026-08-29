import { NextResponse } from 'next/server'
import { requireUser } from '../../../lib/auth'
import { checkAndConsumeGeneration } from '../../../lib/usage'

function fallback(input) {
  const topic = String(input.topic || '').trim()
  const platform = input.platform || 'Instagram'
  const audience = input.audience || input.brand?.audience || 'your audience'
  const objective = input.objective || 'Grow engagement'
  const brand = input.brand || {}
  const voice = brand.voice || 'clear, confident, useful and human'
  const positioning = brand.positioning || 'a credible brand with a differentiated point of view'
  const formats = ['Educational', 'Founder POV', 'Storytelling', 'Product', 'Proof']
  const concepts = formats.map((format, i) => ({ title: `${format}: ${topic}`, angle: format, hook: `${topic} becomes more valuable when ${audience} can see the outcome before the pitch.`, caption: `${format === 'Founder POV' ? 'A useful perspective for anyone working on' : format === 'Storytelling' ? 'Here is the story behind a better way to think about' : format === 'Proof' ? 'The strongest case for' : format === 'Product' ? 'If you are evaluating' : 'A practical way to approach'} ${topic}.\n\nFocus on the problem, make the value concrete, and give ${audience} a reason to care now.\n\nFor ${brand.name || 'our brand'}, the goal is not to sound louder. It is to be more useful, recognizable and consistent with our positioning: ${positioning}.`, cta: i === 4 ? 'Ask your audience what proof they need to see.' : 'Save this and use it for your next post.', visual: `Professional ${format.toLowerCase()} creative for ${topic}, aligned to a ${voice} brand voice, designed for ${platform}.`, score: 9.2 - i * 0.1 }))
  return { strategy: `${objective} campaign for ${audience} on ${platform}, expressed through five distinct creative formats and guided by the brand positioning.`, brandGuidance: `Voice: ${voice}. Positioning: ${positioning}.`, concepts }
}

async function generateWithGemini(input) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const brand = input.brand || {}
  const prompt = `You are the senior creative strategist for a professional brand content platform. Create exactly 5 genuinely different social content concepts, not five rewrites of the same post. Each must use a different format from Educational, Founder POV, Storytelling, Product, Proof, Community, Contrarian, UGC, Carousel, or Short-form Video. Respect the selected platform and objective. Treat the brand profile as binding creative direction. Brand name: ${brand.name || 'Not provided'}. Description: ${brand.description || 'Not provided'}. Audience: ${brand.audience || input.audience || 'Not provided'}. Voice: ${brand.voice || 'clear and human'}. Positioning: ${brand.positioning || 'Not provided'}. Products/services: ${brand.products || 'Not provided'}. Topic: ${input.topic}. Platform: ${input.platform || 'Instagram'}. Objective: ${input.objective || 'Grow engagement'}. Return only valid JSON with {"strategy":"...","brandGuidance":"...","concepts":[{"title":"...","angle":"...","hook":"...","caption":"...","cta":"...","visual":"...","score":9.4}]}. Captions must sound publishable, specific and non-generic. Visual must describe an executable creative direction, not claim an image was generated.`
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.9 } }) })
  if (!response.ok) throw new Error('Gemini request failed')
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.map(x => x.text || '').join('') || ''
  return JSON.parse(text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim())
}

export async function POST(request) {
  try {
    const auth = await requireUser(request)
    if (auth.response) return auth.response
    const input = await request.json()
    if (!String(input.topic || '').trim()) return NextResponse.json({ error: 'Topic is required.' }, { status: 400 })
    const usage = await checkAndConsumeGeneration(auth.user)
    if (!usage.allowed) return NextResponse.json({ error: 'Daily generation limit reached.', used: usage.used, limit: usage.limit }, { status: 429 })
    let result
    try { result = await generateWithGemini(input) } catch { result = null }
    result = result || fallback(input)
    return NextResponse.json({ ...result, usage })
  } catch (error) { return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 }) }
}
