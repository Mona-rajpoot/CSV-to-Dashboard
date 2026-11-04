// Small RFC-4180 style CSV parser (quotes, escaped quotes, multiline cells, auto delimiter)
export function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '')
  const first = text.split(/\r?\n/)[0] || ''
  const delim = [',', ';', '\t', '|'].map((d) => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0]
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false }
      else field += c
    } else if (c === '"') quoted = true
    else if (c === delim) { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''; rows.push(row); row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export function readCSV(text) {
  if (text.includes('\u0000')) throw new Error('This file looks like a binary file, not a CSV. Export your data as .csv and try again.')
  const rows = parseCSV(text)
  if (rows.length === 0) throw new Error('The file is empty. Upload a CSV with a header row and at least one record.')
  if (rows.length === 1) throw new Error('The file only has a header row. Add at least one data row.')
  const seen = {}
  const headers = rows[0].map((h, i) => {
    const name = h.trim() || `Column ${i + 1}`
    seen[name] = (seen[name] || 0) + 1
    return seen[name] > 1 ? `${name} (${seen[name]})` : name
  })
  if (headers.length < 2 && rows.length < 3) throw new Error('Could not detect columns. Check that the file is comma, semicolon, or tab separated.')
  return { headers, rows: rows.slice(1) }
}
