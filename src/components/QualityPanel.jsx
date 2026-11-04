export default function QualityPanel({ data }) {
  const { records, columns, duplicates, missingTotal } = data
  const cells = records.length * columns.length
  const score = cells ? Math.max(0, Math.round(100 - ((missingTotal + duplicates * columns.length) / cells) * 100)) : 0
  const summary = [
    ['Quality score', `${score}%`],
    ['Missing values', missingTotal.toLocaleString()],
    ['Duplicate records', duplicates.toLocaleString()],
    ['Complete columns', `${columns.filter((c) => !c.missing).length} / ${columns.length}`],
  ]
  return (
    <div className="space-y-4 rise">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map(([l, v]) => <div key={l} className="card p-5"><p className="text-sm text-slate-400">{l}</p><p className="mt-2 text-2xl font-bold text-white">{v}</p></div>)}
      </div>
      <div className="card overflow-x-auto p-5">
        <h3 className="mb-3 font-semibold text-white">Columns</h3>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400"><tr><th className="py-2">Column</th><th>Type</th><th>Unique values</th><th>Missing</th><th className="w-1/4">Completeness</th></tr></thead>
          <tbody>
            {columns.map((c) => {
              const pct = records.length ? Math.round(((records.length - c.missing) / records.length) * 100) : 0
              return (
                <tr key={c.name} className="border-t border-white/5">
                  <td className="py-2 font-medium text-slate-200">{c.name}</td>
                  <td><span className={`rounded px-2 py-0.5 text-xs ${c.type === 'numeric' ? 'bg-accent/20 text-accent-soft' : 'bg-white/10 text-slate-300'}`}>{c.type}</span></td>
                  <td>{c.unique}</td><td>{c.missing}</td>
                  <td><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded bg-navy-700"><div className="h-2 rounded bg-accent transition-all" style={{ width: `${pct}%` }} /></div><span className="w-10 text-xs">{pct}%</span></div></td>
                </tr>)
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
