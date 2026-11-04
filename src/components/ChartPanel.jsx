import { useEffect, useMemo, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import { aggregate } from '../utils/analyze'

Chart.defaults.color = '#94a3b8'
Chart.defaults.font.family = 'Inter, system-ui, sans-serif'
const PALETTE = ['#3b82f6', '#60a5fa', '#818cf8', '#22d3ee', '#2dd4bf', '#a78bfa', '#38bdf8', '#6366f1', '#0ea5e9', '#14b8a6', '#93c5fd', '#c4b5fd']
const TYPES = [['bar', 'Bar'], ['line', 'Line'], ['pie', 'Pie'], ['doughnut', 'Doughnut']]

export default function ChartPanel({ columns, records, init }) {
  const [cfg, setCfg] = useState(init)
  const canvas = useRef()
  const chart = useRef()
  const nums = columns.filter((c) => c.type === 'numeric')
  const set = (k) => (e) => setCfg((c) => ({ ...c, [k]: e.target.value }))
  const rows = useMemo(() => aggregate(records, cfg.x, cfg.y, cfg.agg, cfg.type === 'line'), [records, cfg])

  useEffect(() => {
    chart.current?.destroy()
    if (!canvas.current || !rows.length) return
    const round = cfg.type === 'pie' || cfg.type === 'doughnut'
    chart.current = new Chart(canvas.current, {
      type: cfg.type,
      data: {
        labels: rows.map((r) => r[0]),
        datasets: [{
          label: cfg.y === '__count' ? 'Count' : `${cfg.agg === 'sum' ? 'Sum' : 'Average'} of ${cfg.y}`,
          data: rows.map((r) => Math.round(r[1] * 100) / 100),
          backgroundColor: round ? PALETTE : cfg.type === 'line' ? 'rgba(59,130,246,.15)' : '#3b82f6',
          borderColor: round ? '#0f1a3a' : '#3b82f6',
          borderRadius: cfg.type === 'bar' ? 6 : 0, fill: cfg.type === 'line', tension: 0.3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: round, position: 'bottom' } },
        scales: round ? {} : { x: { grid: { display: false } }, y: { grid: { color: 'rgba(148,163,184,.1)' }, beginAtZero: true } },
      },
    })
    return () => chart.current?.destroy()
  }, [rows, cfg.type, cfg.y, cfg.agg])

  return (
    <div className="card p-5 rise">
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select className="input" aria-label="Chart type" value={cfg.type} onChange={set('type')}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l} chart</option>)}</select>
        <select className="input" aria-label="Group by" value={cfg.x} onChange={set('x')}>{columns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select>
        <select className="input" aria-label="Value" value={cfg.y} onChange={set('y')}>
          <option value="__count">Record count</option>
          {nums.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <select className="input" aria-label="Aggregation" disabled={cfg.y === '__count'} value={cfg.agg} onChange={set('agg')}><option value="sum">Sum</option><option value="avg">Average</option></select>
      </div>
      <div className="h-72">
        {rows.length ? <canvas ref={canvas} /> : <p className="grid h-full place-items-center text-sm text-slate-500">No plottable values for this selection. Try a different column.</p>}
      </div>
    </div>
  )
}
