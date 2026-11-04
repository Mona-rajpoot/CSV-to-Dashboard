export const toNum = (v) => {
  const s = String(v ?? '').trim().replace(/[$€£,%\s]/g, '')
  return s === '' ? NaN : Number(s)
}
export const isEmpty = (v) => v == null || String(v).trim() === ''

export function analyze({ headers, rows }) {
  const records = rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])))
  const columns = headers.map((name) => {
    const vals = records.map((r) => r[name])
    const filled = vals.filter((v) => !isEmpty(v))
    const numeric = filled.length > 0 && filled.filter((v) => !isNaN(toNum(v))).length / filled.length >= 0.9
    return { name, type: numeric ? 'numeric' : 'categorical', missing: vals.length - filled.length, unique: new Set(filled).size }
  })
  const seen = new Set()
  let duplicates = 0
  records.forEach((r) => {
    const key = JSON.stringify(headers.map((h) => r[h]))
    seen.has(key) ? duplicates++ : seen.add(key)
  })
  const missingTotal = columns.reduce((a, c) => a + c.missing, 0)
  return { headers, records, columns, duplicates, missingTotal }
}

export function stats(records, col) {
  const v = records.map((r) => toNum(r[col])).filter((n) => !isNaN(n))
  if (!v.length) return { avg: 0, max: 0, min: 0, sum: 0 }
  const sum = v.reduce((a, b) => a + b, 0)
  return { avg: sum / v.length, max: Math.max(...v), min: Math.min(...v), sum }
}

export const fmt = (n) => Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : Number(n.toFixed(2)).toLocaleString()

export function aggregate(records, x, y, agg, sortByLabel) {
  const map = new Map()
  for (const r of records) {
    const key = isEmpty(r[x]) ? '(blank)' : r[x]
    const v = y === '__count' ? 1 : toNum(r[y])
    if (isNaN(v)) continue
    const e = map.get(key) || { s: 0, n: 0 }
    e.s += v; e.n++
    map.set(key, e)
  }
  let arr = [...map].map(([k, e]) => [k, y === '__count' || agg === 'sum' ? e.s : e.s / e.n])
  arr = sortByLabel ? arr.sort((a, b) => String(a[0]).localeCompare(String(b[0]))) : arr.sort((a, b) => b[1] - a[1])
  return arr.slice(0, sortByLabel ? 60 : 12)
}
