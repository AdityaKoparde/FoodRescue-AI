/**
 * Vision proxy. Keeps the provider key on the server and nothing else.
 * If the key is missing or the provider is down, the client falls back to a
 * rule-based listing — the rescue workflow never depends on this endpoint.
 */

type Guess = {
  title: string
  kind: 'veg' | 'nonveg' | 'bakery' | 'mixed'
  meals: number
  kg: number
  allergens: string[]
}

const PROMPT = `You are reading one photo of surplus prepared food in an Indian food-service kitchen.
Return JSON only, with this shape:
{"title": string, "kind": "veg"|"nonveg"|"bakery"|"mixed", "meals": number, "kg": number, "allergens": string[]}
Rules:
- Describe only what is visible. No brand names, no invented ingredients.
- meals is a conservative portion estimate. kg is an approximate total weight.
- allergens: list only what is likely present and visible (dairy, gluten, nuts, egg, soy).
- Never state or imply that the food is safe to eat, fresh, or fit for donation.`

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }

  const key = process.env.GEMINI_API_KEY
  if (!key) {
    res.status(501).json({ error: 'vision not configured' })
    return
  }

  let payload: { image?: string } = req.body ?? {}
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      payload = {}
    }
  }

  const image = payload.image
  const match = typeof image === 'string' ? image.match(/^data:(image\/[a-z+]+);base64,(.+)$/i) : null
  if (!match) {
    res.status(400).json({ error: 'expected a base64 image data URL' })
    return
  }

  const [, mime, data] = match

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                { inline_data: { mime_type: mime, data } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: 400,
          },
        }),
      },
    )

    if (!upstream.ok) {
      res.status(502).json({ error: 'vision provider rejected the request' })
      return
    }

    const json: any = await upstream.json()
    const text: string =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const guess = JSON.parse(text) as Guess
    if (!guess?.title || !guess?.meals) {
      res.status(502).json({ error: 'unreadable answer' })
      return
    }

    res.status(200).json(guess)
  } catch {
    res.status(502).json({ error: 'vision provider unreachable' })
  }
}
