const TONE = { good: ['bg-emerald-400', 'Positive'], warn: ['bg-amber-400', 'Needs attention'], info: ['bg-accent-soft', 'Info'] }

export default function InsightsPanel({ insights, compact, onMore }) {
  return (
    <section className="space-y-3 rise">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{compact ? 'Key findings' : 'Automatic insights'}</h3>
        {compact && <button onClick={onMore} className="text-sm text-accent-soft hover:underline">View all</button>}
      </div>
      {!compact && <p className="text-sm text-slate-400">Calculated directly from your data: trends, unusual values, concentration and data issues.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((i, k) => (
          <div key={k} className="card p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
              <span className={`h-2 w-2 rounded-full ${TONE[i.severity][0]}`} />{i.type} · {TONE[i.severity][1]}
            </div>
            <h4 className="mt-2 font-semibold text-white">{i.title}</h4>
            <p className="mt-1 text-sm text-slate-400">{i.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
