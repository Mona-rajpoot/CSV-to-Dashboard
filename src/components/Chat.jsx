import { useEffect, useRef, useState } from 'react'
import { callAI } from '../utils/ai'
import { runQuery, primaryMetric } from '../utils/insights'

// Always render plain text, even if the AI returns something unexpected
const str = (v) => (typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v))
const schemaOf = (data) => data.columns.map((c) => ({ name: c.name, type: c.type, examples: c.type === 'categorical' ? [...new Set(data.records.map((r) => r[c.name]).filter(Boolean))].slice(0, 5) : undefined }))

// How it answers: AI turns the question into a structured query -> we run it on the full dataset -> AI phrases the real result.
export default function Chat({ data }) {
  const [msgs, setMsgs] = useState([{ role: 'ai', text: 'Ask me anything about your uploaded data. I calculate answers from your actual records.' }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef()
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [msgs, busy])
  const metric = primaryMetric(data)
  const cat = data.columns.find((c) => c.type === 'categorical' && c.unique >= 2 && c.unique <= 30)?.name
  const starters = [metric && cat && `Which ${cat} has the highest ${metric}?`, metric && `What is the average ${metric}?`, cat && `How many records are there per ${cat}?`].filter(Boolean)

  const ask = async (q) => {
    q = q.trim()
    if (!q || busy) return
    setInput(''); setBusy(true); setMsgs((m) => [...m, { role: 'user', text: q }])
    try {
      const { data: plan } = await callAI('plan', { question: q, rows: data.records.length, columns: schemaOf(data) })
      if (!plan || typeof plan !== 'object' || Array.isArray(plan)) throw new Error('The AI gave an unexpected reply. Please rephrase your question.')
      if (!plan.answerable) { setMsgs((m) => [...m, { role: 'ai', text: str(plan.reason) || "I can't answer that from this dataset." }]); return }
      const result = runQuery(data, plan)
      const { text } = await callAI('answer', { question: q, plan, result })
      if (!text) throw new Error('The AI returned an empty answer. Please try again.')
      setMsgs((m) => [...m, { role: 'ai', text, source: `${plan.agg}${plan.metric ? ' of ' + plan.metric : ''}${plan.groupBy ? ' by ' + plan.groupBy : ''} · ${result.matchedRecords} records matched` }])
    } catch (e) { setMsgs((m) => [...m, { role: 'ai', text: e.message, error: true }]) }
    finally { setBusy(false) }
  }

  return (
    <div className="card flex h-[70vh] flex-col rise">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : ''}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-accent text-white' : m.error ? 'border border-red-500/30 bg-red-500/10 text-red-300' : 'bg-navy-700 text-slate-200'}`}>
              {str(m.text)}{m.source && <p className="mt-1 text-xs text-slate-400">Based on: {str(m.source)}</p>}
            </div>
          </div>))}
        {busy && <div className="flex items-center gap-2 text-sm text-slate-400"><span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />Thinking…</div>}
        <div ref={end} />
      </div>
      <div className="border-t border-white/10 p-4">
        {msgs.length === 1 && <div className="mb-3 flex flex-wrap gap-2">{starters.map((s) => <button key={s} onClick={() => ask(s)} className="btn-ghost !py-1 text-xs">{s}</button>)}</div>}
        <form onSubmit={(e) => { e.preventDefault(); ask(input) }} className="flex gap-2">
          <input className="input flex-1" placeholder="Ask a question about your data" aria-label="Question" value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} />
          <button className="btn-primary" disabled={busy || !input.trim()}>Ask</button>
        </form>
      </div>
    </div>)
}
