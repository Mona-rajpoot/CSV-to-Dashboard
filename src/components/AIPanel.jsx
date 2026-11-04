const PRIORITY = { high: 'bg-red-500/15 text-red-300', medium: 'bg-amber-500/15 text-amber-300', low: 'bg-accent/20 text-accent-soft' }
const List = ({ title, items }) => (
  <div className="card p-5">
    <h3 className="mb-3 font-semibold text-white">{title}</h3>
    <ul className="space-y-3">{(items || []).map((p, i) => <li key={i}><p className="font-medium text-slate-100">{p.title}</p><p className="text-sm text-slate-400">{p.explanation}</p></li>)}</ul>
  </div>
)

// One AI analysis powers two views: mode="analyst" (summary, patterns, insights) and mode="recs" (recommendations)
export default function AIPanel({ ai, onRun, mode }) {
  const recs = mode === 'recs'
  const title = recs ? 'Business recommendations' : 'AI data analyst'
  if (ai.status === 'loading') return (
    <div className="card flex items-center gap-3 p-8 text-slate-300 rise" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" /> Analyzing your data with AI. This usually takes 10 to 20 seconds…
    </div>)
  if (ai.status !== 'done') return (
    <div className="card p-8 rise">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        {recs ? 'Get specific, data-backed actions to improve performance.' : 'Get a plain-English explanation of your data, with patterns and business insights.'}
        {' '}This sends a statistical summary and a few sample rows (not the whole file) to Google Gemini.
      </p>
      {ai.status === 'error' && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{ai.error}</p>}
      <button onClick={onRun} className="btn-primary mt-5">{ai.status === 'error' ? 'Try again' : 'Run AI analysis'}</button>
    </div>)
  const r = ai.result
  return (
    <div className="space-y-4 rise">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-white">{title}</h2><button onClick={onRun} className="btn-ghost">Re-run analysis</button></div>
      {recs ? (
        <div className="grid gap-4 md:grid-cols-2">
          {(r.recommendations || []).map((x, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between gap-2"><span className="text-xs text-slate-500">{x.area}</span><span className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY[x.priority] || PRIORITY.low}`}>{x.priority}</span></div>
              <h4 className="mt-2 font-semibold text-white">{x.title}</h4>
              <p className="mt-1 text-sm text-slate-200">{x.action}</p>
              <p className="mt-2 border-t border-white/10 pt-2 text-xs text-slate-400">Evidence: {x.evidence}</p>
            </div>))}
        </div>
      ) : (
        <>
          <div className="card border-accent/30 p-5"><p className="text-xs uppercase tracking-wide text-accent-soft">Summary</p><p className="mt-2 text-slate-200">{r.summary}</p></div>
          <div className="grid gap-4 lg:grid-cols-2"><List title="Patterns and trends" items={r.patterns} /><List title="Business insights" items={r.insights} /></div>
        </>)}
    </div>)
}
