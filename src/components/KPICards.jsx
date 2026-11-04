import { useState } from 'react'
import { stats, fmt } from '../utils/analyze'

export default function KPICards({ data, fileName }) {
  const nums = data.columns.filter((c) => c.type === 'numeric')
  const [col, setCol] = useState(nums[0]?.name)
  const s = col ? stats(data.records, col) : null
  const cards = [
    ['Total records', data.records.length.toLocaleString()],
    ...(s ? [['Average', fmt(s.avg)], ['Maximum', fmt(s.max)], ['Minimum', fmt(s.min)]] : []),
  ]
  return (
    <section className="rise">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{fileName}</h2>
          <p className="text-sm text-slate-400">{data.columns.length} columns · {nums.length} numeric · {data.columns.length - nums.length} categorical</p>
        </div>
        {s && (
          <label className="flex items-center gap-2 text-sm text-slate-400">KPI column
            <select className="input" value={col} onChange={(e) => setCol(e.target.value)}>{nums.map((c) => <option key={c.name}>{c.name}</option>)}</select>
          </label>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([label, value], i) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-400">{label}{i > 0 && <span className="text-slate-500"> · {col}</span>}</p>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{value}</p>
          </div>
        ))}
      </div>
      {!s && <p className="mt-3 text-sm text-slate-500">No numeric columns found, so only record counts are available.</p>}
    </section>
  )
}
