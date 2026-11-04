import { jsPDF } from 'jspdf'
import Chart from 'chart.js/auto'
import { stats, fmt, aggregate } from './analyze.js'
import { primaryMetric, monthlySeries } from './insights.js'

// jsPDF's built-in fonts only support Latin characters
const clean = (s) => String(s ?? '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '')

function chartImage(type, labels, values) {
  const canvas = document.createElement('canvas')
  canvas.width = 1000; canvas.height = 460
  const tick = { color: '#334155' }
  const chart = new Chart(canvas, {
    type,
    data: { labels, datasets: [{ data: values, backgroundColor: type === 'bar' ? '#3b82f6' : 'rgba(59,130,246,.15)', borderColor: '#3b82f6', fill: type === 'line', tension: 0.3, borderRadius: 4 }] },
    options: { animation: false, responsive: false, plugins: { legend: { display: false } }, scales: { x: { ticks: tick, grid: { display: false } }, y: { ticks: tick, grid: { color: '#e2e8f0' }, beginAtZero: true } } },
    plugins: [{ id: 'bg', beforeDraw(c) { const x = c.ctx; x.save(); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.restore() } }],
  })
  const img = canvas.toDataURL('image/png')
  chart.destroy()
  return img
}

export async function generateReport({ data, name, insights, ai }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, M = 15, TW = W - 2 * M
  let y = 0
  const room = (h) => { if (y + h > 280) { doc.addPage(); y = M } }
  const text = (t, size = 10, color = [51, 65, 85], bold = false, gap = 1.5) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color)
    for (const l of doc.splitTextToSize(clean(t), TW)) { room(size * 0.45); doc.text(l, M, y + size * 0.35); y += size * 0.45 }
    y += gap
  }
  const h2 = (t) => { room(16); y += 5; text(t, 14, [10, 17, 40], true, 1); doc.setDrawColor(59, 130, 246); doc.setLineWidth(0.7); doc.line(M, y, M + 20, y); y += 4 }
  const image = (img) => { const h = TW * 0.46; room(h + 4); doc.addImage(img, 'PNG', M, y, TW, h); y += h + 4 }

  doc.setFillColor(10, 17, 40); doc.rect(0, 0, W, 34, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('Business Intelligence Report', M, 15)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(147, 197, 253)
  doc.text(clean(`${name}  |  Generated ${new Date().toLocaleDateString()}  |  CSV2Dashboard`), M, 24)
  y = 44

  const metric = primaryMetric(data), s = metric ? stats(data.records, metric) : null
  const kpis = s
    ? [['Records', data.records.length.toLocaleString()], [`Total ${metric}`, fmt(s.sum)], [`Avg ${metric}`, fmt(s.avg)], ['Missing values', String(data.missingTotal)]]
    : [['Records', data.records.length.toLocaleString()], ['Columns', String(data.columns.length)], ['Missing values', String(data.missingTotal)], ['Duplicates', String(data.duplicates)]]
  h2('Key metrics')
  const bw = (TW - 9) / 4
  kpis.forEach(([l, v], i) => {
    const x = M + i * (bw + 3)
    doc.setFillColor(241, 245, 249); doc.roundedRect(x, y, bw, 20, 2, 2, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(clean(l), x + 3, y + 7)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(10, 17, 40); doc.text(clean(v), x + 3, y + 15)
  })
  y += 24
  if (s) text(`Maximum ${fmt(s.max)}  |  Minimum ${fmt(s.min)}  |  Duplicate records ${data.duplicates}  |  Columns ${data.columns.length}`, 9, [100, 116, 139])

  const cat = data.columns.find((c) => c.type === 'categorical' && c.unique >= 2 && c.unique <= 30)
  if (metric && cat) { h2(`${metric} by ${cat.name}`); const a = aggregate(data.records, cat.name, metric, 'sum', false).slice(0, 8); image(chartImage('bar', a.map((r) => r[0]), a.map((r) => r[1]))) }
  const series = monthlySeries(data)
  if (series.length >= 2) { h2(`${metric} trend by month`); image(chartImage('line', series.map((r) => r[0]), series.map((r) => Math.round(r[1] * 100) / 100))) }

  h2('Key findings')
  insights.forEach((i) => { text(`${i.title}`, 10, [10, 17, 40], true, 0.5); text(i.detail, 9.5, [71, 85, 105], false, 3) })

  if (ai) {
    h2('AI summary'); text(ai.summary, 10, [51, 65, 85], false, 2)
    h2('Business recommendations')
    ;(ai.recommendations || []).forEach((r, i) => {
      text(`${i + 1}. ${r.title}  [${String(r.priority || '').toUpperCase()}]`, 10.5, [10, 17, 40], true, 0.5)
      text(`Action: ${r.action}`, 9.5, [51, 65, 85], false, 0.5)
      text(`Why: ${r.evidence}`, 9, [100, 116, 139], false, 3.5)
    })
  } else { h2('AI analysis'); text('AI summary and recommendations are not included. Run the AI Analyst in the app before downloading to add them.', 9.5, [100, 116, 139]) }

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) { doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text(`CSV2Dashboard  |  Page ${p} of ${pages}`, M, 290) }
  doc.save(`${name.replace(/\.csv$/i, '') || 'dashboard'}-report.pdf`)
}
