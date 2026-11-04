// Deterministic analysis (no AI): trends, outliers, concentration, quality, plus the query engine used by the chatbot.
import { toNum, isEmpty, fmt, stats } from './analyze.js'

const DATE_RE = /^(\d{4}[-/]\d{1,2}([-/]\d{1,2})?|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/
export const monthKey = (v) => {
  const s = String(v ?? '').trim()
  const m = s.match(/^(\d{4})[-/](\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}`
  if (!DATE_RE.test(s)) return null
  const t = Date.parse(s)
  if (isNaN(t)) return null
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export const findDateCol = (data) =>
  data.columns.find((c) => c.type === 'categorical' && c.unique > 1 && data.records.filter((r) => monthKey(r[c.name])).length / data.records.length >= 0.7)?.name || null
export const primaryMetric = (data) => {
  const nums = data.columns.filter((c) => c.type === 'numeric')
  return (nums.find((c) => /revenue|sales|amount|total|profit|income|price|cost/i.test(c.name)) || nums[0])?.name || null
}
export function monthlySeries(data) {
  const d = findDateCol(data), m = primaryMetric(data)
  if (!d || !m) return []
  const map = new Map()
  for (const r of data.records) {
    const k = monthKey(r[d]), v = toNum(r[m])
    if (k && !isNaN(v)) map.set(k, (map.get(k) || 0) + v)
  }
  return [...map].sort((a, b) => a[0].localeCompare(b[0]))
}
function groupSum(records, col, metric) {
  const map = new Map()
  for (const r of records) { const v = toNum(r[metric]); if (!isNaN(v)) { const k = r[col] || '(blank)'; map.set(k, (map.get(k) || 0) + v) } }
  return [...map].sort((a, b) => b[1] - a[1])
}

export function computeInsights(data) {
  const out = [], { records, columns } = data, metric = primaryMetric(data)
  const add = (type, severity, title, detail) => out.push({ type, severity, title, detail })
  const series = monthlySeries(data)
  if (series.length >= 3) {
    const half = Math.floor(series.length / 2)
    const avg = (a) => a.reduce((s, x) => s + x[1], 0) / a.length
    const a = avg(series.slice(0, half)), b = avg(series.slice(-half))
    const pct = a ? ((b - a) / Math.abs(a)) * 100 : 0
    add('trend', pct >= 5 ? 'good' : pct <= -5 ? 'warn' : 'info', `${metric} is ${pct >= 5 ? 'trending up' : pct <= -5 ? 'trending down' : 'stable'}`,
      `Average monthly ${metric} moved from ${fmt(a)} (first ${half} months) to ${fmt(b)} (last ${half} months), a ${pct.toFixed(1)}% change.`)
    const sorted = [...series].sort((x, y) => y[1] - x[1])
    add('trend', 'info', 'Strongest and weakest months', `${sorted[0][0]} was the strongest month (${fmt(sorted[0][1])}); ${sorted.at(-1)[0]} was the weakest (${fmt(sorted.at(-1)[1])}).`)
    let big = null
    for (let i = 1; i < series.length; i++) {
      const p = series[i - 1][1]
      if (!p) continue
      const ch = ((series[i][1] - p) / Math.abs(p)) * 100
      if (!big || Math.abs(ch) > Math.abs(big.ch)) big = { ch, from: series[i - 1][0], to: series[i][0] }
    }
    if (big && Math.abs(big.ch) >= 15) add('change', big.ch > 0 ? 'good' : 'warn', `Biggest swing: ${big.ch > 0 ? '+' : ''}${big.ch.toFixed(0)}%`, `${metric} changed ${big.ch.toFixed(1)}% between ${big.from} and ${big.to}.`)
  }
  if (metric) {
    columns.filter((c) => c.type === 'categorical' && c.unique >= 2 && c.unique <= 30 && c.name !== findDateCol(data)).slice(0, 3).forEach((c) => {
      const g = groupSum(records, c.name, metric), total = g.reduce((s, x) => s + Math.max(x[1], 0), 0)
      if (g.length < 2 || total <= 0) return
      const share = (g[0][1] / total) * 100, low = g.at(-1)
      add('concentration', share >= 50 ? 'warn' : 'info', `${g[0][0]} drives ${share.toFixed(0)}% of ${metric}`,
        `By ${c.name}, ${g[0][0]} leads with ${fmt(g[0][1])}; ${low[0]} is lowest with ${fmt(low[1])} (${((Math.max(low[1], 0) / total) * 100).toFixed(1)}% of total).`)
    })
  }
  const label = columns.find((c) => c.type === 'categorical' && c.unique > 1 && c.name !== findDateCol(data))?.name
  columns.filter((c) => c.type === 'numeric').slice(0, 4).forEach((c) => {
    const vals = records.map((r) => toNum(r[c.name])).filter((n) => !isNaN(n)).sort((x, y) => x - y)
    if (vals.length < 8) return
    const q1 = vals[Math.floor(vals.length * 0.25)], q3 = vals[Math.floor(vals.length * 0.75)], iqr = q3 - q1
    if (!iqr) return
    const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr
    const bad = records.filter((r) => { const v = toNum(r[c.name]); return !isNaN(v) && (v < lo || v > hi) })
    if (!bad.length || bad.length > vals.length * 0.1) return
    const worst = bad.reduce((m, r) => (Math.abs(toNum(r[c.name]) - q3) > Math.abs(toNum(m[c.name]) - q3) ? r : m))
    add('anomaly', 'warn', `${bad.length} unusual value${bad.length > 1 ? 's' : ''} in ${c.name}`, `Typical range is ${fmt(lo)} to ${fmt(hi)}. The most extreme is ${fmt(toNum(worst[c.name]))}${label ? ` (${label}: ${worst[label] || 'blank'})` : ''}.`)
  })
  data.columns.filter((c) => c.missing / records.length > 0.05).forEach((c) => add('quality', 'warn', `${c.name} has missing values`, `${c.missing} of ${records.length} records (${((c.missing / records.length) * 100).toFixed(0)}%) are blank, which can skew totals and averages.`))
  if (data.duplicates) add('quality', 'warn', `${data.duplicates} duplicate records`, 'Exact duplicate rows were found and may be double-counted in your totals.')
  if (!out.length) add('info', 'info', 'No major issues found', 'No strong trends, outliers or data problems were detected automatically.')
  return out
}

// Compact summary sent to the AI (never the whole file)
export function buildProfile(data, insights) {
  const { records, columns } = data, metric = primaryMetric(data)
  return {
    rows: records.length, duplicates: data.duplicates, dateColumn: findDateCol(data), primaryMetric: metric,
    columns: columns.map((c) => {
      const o = { name: c.name, type: c.type, missing: c.missing, unique: c.unique }
      if (c.type === 'numeric') { const s = stats(records, c.name); Object.assign(o, { min: s.min, max: s.max, avg: +s.avg.toFixed(2), sum: +s.sum.toFixed(2) }) }
      else { const cnt = {}; records.forEach((r) => { if (r[c.name]) cnt[r[c.name]] = (cnt[r[c.name]] || 0) + 1 }); o.topValues = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, n]) => `${v} (${n})`) }
      return o
    }),
    monthlyTotals: monthlySeries(data).slice(-24).map(([m, v]) => ({ month: m, total: +v.toFixed(2) })),
    byCategory: metric ? columns.filter((c) => c.type === 'categorical' && c.unique >= 2 && c.unique <= 30).slice(0, 3).map((c) => ({ column: c.name, metric, top: groupSum(records, c.name, metric).slice(0, 6).map(([v, t]) => ({ value: v, total: +t.toFixed(2) })) })) : [],
    detectedFindings: insights.map((i) => `${i.title}: ${i.detail}`),
    sampleRows: records.slice(0, 8),
  }
}

// Executes the structured query the AI planned, on the FULL dataset
export function runQuery(data, plan) {
  const cols = data.columns, has = (n) => cols.some((c) => c.name === n)
  const { groupBy = null, metric = null, agg = 'sum', bucket = null, sort = 'desc', limit = 10, } = plan
  const filters = Array.isArray(plan.filters) ? plan.filters : []
  if (groupBy && !has(groupBy)) throw new Error(`The AI referred to an unknown column "${groupBy}". Try rephrasing your question.`)
  if (agg !== 'count' && !(metric && cols.find((c) => c.name === metric)?.type === 'numeric')) throw new Error('This question needs a numeric column that I could not match. Try rephrasing.')
  if (filters.some((f) => !has(f.column))) throw new Error('The AI referred to an unknown column. Try rephrasing your question.')
  const rows = data.records.filter((r) => filters.every((f) => {
    const v = String(r[f.column]).toLowerCase(), s = String(f.value).toLowerCase()
    return f.op === 'eq' ? v === s : f.op === 'contains' ? v.includes(s) : f.op === 'gt' ? toNum(v) > toNum(s) : f.op === 'lt' ? toNum(v) < toNum(s) : true
  }))
  const groups = new Map()
  for (const r of rows) {
    let k = 'All matching records'
    if (groupBy) k = (bucket === 'month' ? monthKey(r[groupBy]) : null) || r[groupBy] || '(blank)'
    const v = agg === 'count' ? 1 : toNum(r[metric])
    if (isNaN(v)) continue
    const g = groups.get(k) || { n: 0, s: 0, max: -Infinity, min: Infinity }
    g.n++; g.s += v; g.max = Math.max(g.max, v); g.min = Math.min(g.min, v)
    groups.set(k, g)
  }
  const val = (g) => ({ sum: g.s, avg: g.s / g.n, count: g.n, max: g.max, min: g.min })[agg] ?? g.s
  const out = [...groups].map(([group, g]) => ({ group, value: +val(g).toFixed(2) })).sort((a, b) => (sort === 'asc' ? a.value - b.value : b.value - a.value))
  return { matchedRecords: rows.length, totalGroups: out.length, rows: out.slice(0, Math.min(Math.max(1, Number(limit) || 10), 20)) }
}
