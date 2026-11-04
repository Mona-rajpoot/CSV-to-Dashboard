import { useMemo, useState } from 'react'
import { toNum } from '../utils/analyze'

const PAGE = 10

export default function DataTable({ data }) {
  const { headers, records, columns } = data
  const [q, setQ] = useState('')
  const [fCol, setFCol] = useState('')
  const [fVal, setFVal] = useState('')
  const [sort, setSort] = useState({ col: null, dir: 1 })
  const [page, setPage] = useState(0)
  const filterable = columns.filter((c) => c.type === 'categorical' && c.unique > 0 && c.unique <= 100)
  const options = useMemo(() => (fCol ? [...new Set(records.map((r) => r[fCol]).filter(Boolean))].sort() : []), [fCol, records])

  const rows = useMemo(() => {
    let r = records
    const s = q.trim().toLowerCase()
    if (s) r = r.filter((x) => headers.some((h) => x[h].toLowerCase().includes(s)))
    if (fCol && fVal) r = r.filter((x) => x[fCol] === fVal)
    if (sort.col) {
      const numeric = columns.find((c) => c.name === sort.col).type === 'numeric'
      r = [...r].sort((a, b) => (numeric ? toNum(a[sort.col]) - toNum(b[sort.col]) : a[sort.col].localeCompare(b[sort.col])) * sort.dir)
    }
    return r
  }, [records, q, fCol, fVal, sort])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(page, pages - 1)
  const clear = () => { setQ(''); setFCol(''); setFVal(''); setSort({ col: null, dir: 1 }); setPage(0) }

  return (
    <div className="card p-5 rise">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input className="input min-w-[200px] flex-1" placeholder="Search all columns" aria-label="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} />
        <select className="input" aria-label="Filter column" value={fCol} onChange={(e) => { setFCol(e.target.value); setFVal(''); setPage(0) }}>
          <option value="">Filter by…</option>{filterable.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
        {fCol && <select className="input" aria-label="Filter value" value={fVal} onChange={(e) => { setFVal(e.target.value); setPage(0) }}><option value="">All values</option>{options.map((o) => <option key={o}>{o}</option>)}</select>}
        <button className="btn-ghost" onClick={clear}>Clear</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-700/60 text-slate-300">
            <tr>{headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">
                <button onClick={() => setSort((s) => ({ col: h, dir: s.col === h ? -s.dir : 1 }))} className="hover:text-white">
                  {h} {sort.col === h ? (sort.dir === 1 ? '↑' : '↓') : ''}
                </button>
              </th>))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(cur * PAGE, cur * PAGE + PAGE).map((r, i) => (
              <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                {headers.map((h) => <td key={h} className="whitespace-nowrap px-3 py-2">{r[h] || <span className="text-red-400/70">—</span>}</td>)}
              </tr>))}
            {!rows.length && <tr><td colSpan={headers.length} className="px-3 py-8 text-center text-slate-500">No records match your search or filter.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>{rows.length.toLocaleString()} of {records.length.toLocaleString()} records</span>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</button>
          <span>Page {cur + 1} of {pages}</span>
          <button className="btn-ghost" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}
