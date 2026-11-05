// Serverless AI proxy (Vercel function; also served by Vite in dev). Holds GEMINI_API_KEY server-side.
const hits = new Map()

const PROMPTS = {
  analyze: { json: true, system: `You are a senior business data analyst writing for a non-technical business owner. You receive a JSON profile of an uploaded dataset: column stats, top values, monthly totals, pre-computed findings and sample rows. Use ONLY facts and numbers present in the profile; never invent data. Reply with JSON only: {"summary": "3-4 plain-English sentences on what the data shows", "patterns": [{"title","explanation"}] (3-5 notable patterns/trends), "insights": [{"title","explanation"}] (3-5 business insights, include numbers), "recommendations": [{"title","action","evidence","priority":"high|medium|low","area"}] (4-6)}. Every recommendation must be specific: name the exact column values/segments and cite the numbers that justify it, and say a concrete action. Never give generic advice (e.g. "improve marketing"). If the data is too limited for a conclusion, say so.` },
  plan: { json: true, system: `Translate the user's question into a query over their dataset. You get the column names/types with example values. Reply with JSON only: {"answerable": boolean, "reason": "why not, if unanswerable", "groupBy": column or null, "bucket": "month" or null (only to group a date column by month), "metric": numeric column or null, "agg": "sum|avg|count|max|min", "filters": [{"column","op":"eq|contains|gt|lt","value"}], "sort": "desc|asc", "limit": number}. Use exact column names only. If the question cannot be answered from these columns or is unrelated to the data, set answerable to false.` },
  answer: { json: false, system: `Answer the user's question in 1-3 clear sentences using ONLY the query result provided. Quote exact numbers. If there are no matching rows, say so. Do not add outside knowledge.` },
}

export default async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)) }
  if (req.method !== 'POST') return send(405, { error: 'Method not allowed.' })
  const key = process.env.GEMINI_API_KEY
  const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
  if (!key) return send(500, { error: 'AI is not configured yet. Add GEMINI_API_KEY to your .env file (see README).' })

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0]
  const now = Date.now(); const recent = (hits.get(ip) || []).filter((t) => now - t < 60000)
  if (recent.length >= 15) return send(429, { error: 'Too many AI requests. Please wait a minute and try again.' })
  hits.set(ip, [...recent, now])

  const { mode, payload } = req.body || {}
  const cfg = PROMPTS[mode]
  if (!cfg || !payload) return send(400, { error: 'Invalid AI request.' })
  const userText = JSON.stringify(payload)
  if (userText.length > 80000) return send(413, { error: 'Dataset summary is too large to analyze.' })

  try {
    const request = () => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: cfg.system }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192, ...(cfg.json ? { responseMimeType: 'application/json' } : {}) },
      }),
    })
    let r = await request()
    // Google returns 500/503 when its servers are busy: retry a couple of times before giving up
    for (let i = 0; i < 2 && (r.status === 503 || r.status === 500); i++) {
      await new Promise((done) => setTimeout(done, 1500 * (i + 1)))
      r = await request()
    }
    if (!r.ok) {
      const detail = await r.json().then((j) => j.error?.message || '').catch(() => '')
      console.error('[Gemini]', r.status, detail)
      const extra = ` (model used: ${MODEL})` + (detail ? ` Google says: ${detail.slice(0, 220)}` : '')
      if (r.status === 429) return send(429, { error: 'Rate or quota limit reached for this model.' + extra })
      if (r.status === 400 || r.status === 403) return send(502, { error: 'Google rejected the request (check the API key).' + extra })
      if (r.status === 404) return send(502, { error: 'Model not found. Change GEMINI_MODEL in .env.' + extra })
      if (r.status === 503 || r.status === 500) return send(503, { error: "Google's AI service is busy. Try again in a minute." + extra })
      return send(502, { error: `The AI provider returned an error (${r.status}).` + extra })
    }
    const out = await r.json()
    const text = (out.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim()
    if (!text) return send(502, { error: 'The AI returned an empty response. Try again.' })
    if (!cfg.json) return send(200, { text })
    try { return send(200, { data: JSON.parse(text.replace(/^```json|```$/g, '').trim()) }) }
    catch { return send(502, { error: 'The AI response could not be read. Try again.' }) }
  } catch {
    return send(502, { error: 'Could not reach the AI service. Check your connection.' })
  }
}
