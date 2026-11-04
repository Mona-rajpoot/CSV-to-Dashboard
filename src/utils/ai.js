// Browser -> our own /api/ai endpoint (the API key lives only on the server)
export async function callAI(mode, payload) {
  let res
  try {
    res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, payload }) })
  } catch { throw new Error('Could not reach the server. Check your connection.') }
  let body
  try { body = await res.json() } catch { throw new Error('The AI service returned an unreadable response.') }
  if (!res.ok) throw new Error(body.error || 'The AI request failed.')
  return body
}
