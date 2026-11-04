import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Uploader from './components/Uploader'
import KPICards from './components/KPICards'
import ChartPanel from './components/ChartPanel'
import DataTable from './components/DataTable'
import QualityPanel from './components/QualityPanel'
import InsightsPanel from './components/InsightsPanel'
import AIPanel from './components/AIPanel'
import Chat from './components/Chat'
import { readCSV } from './utils/csv'
import { analyze } from './utils/analyze'
import { computeInsights, buildProfile } from './utils/insights'
import { callAI } from './utils/ai'
import { generateReport } from './utils/report'
import { SAMPLE_CSV } from './data/sample'

const MAX_BYTES = 10 * 1024 * 1024

function defaultCharts(columns) {
  const cats = columns.filter((c) => c.type === 'categorical')
  const nums = columns.filter((c) => c.type === 'numeric')
  const lowCard = cats.filter((c) => c.unique > 1 && c.unique <= 12)
  const dateCol = cats.find((c) => /date|time|month|year/i.test(c.name))
  const first = (lowCard[0] || cats[0] || columns[0]).name
  const second = (lowCard[1] || lowCard[0] || cats[0] || columns[0]).name
  const y = nums[0]?.name || '__count'
  const out = [{ type: 'bar', x: first, y, agg: 'sum' }, { type: 'doughnut', x: second, y: '__count', agg: 'sum' }]
  if (dateCol && nums[0]) out.push({ type: 'line', x: dateCol.name, y, agg: 'sum', wide: true })
  return out
}

export default function App() {
  const [data, setData] = useState(null)
  const [name, setName] = useState('')
  const [view, setView] = useState('dashboard')
  const [error, setError] = useState('')
  const [ai, setAi] = useState({ status: 'idle' })
  const [pdfBusy, setPdfBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const insights = useMemo(() => (data ? computeInsights(data) : []), [data])

  const load = (text, fileName) => {
    try {
      setData(analyze(readCSV(text))); setName(fileName); setView('dashboard'); setError(''); setAi({ status: 'idle' }); setNotice('')
    } catch (e) { setError(e.message); setData(null) }
  }
  const onFile = async (file) => {
    if (!/\.csv$/i.test(file.name) && !file.type.includes('csv')) return setError('Unsupported file type. Please upload a .csv file.')
    if (file.size > MAX_BYTES) return setError('File is larger than 10 MB. Try a smaller export.')
    if (file.size === 0) return setError('The file is empty.')
    try { load(await file.text(), file.name) } catch { setError('Could not read this file.') }
  }
  const reset = () => { setData(null); setName(''); setError(''); setView('dashboard'); setAi({ status: 'idle' }); setNotice('') }

  const runAI = async () => {
    setAi({ status: 'loading' })
    try { const r = await callAI('analyze', buildProfile(data, insights)); setAi({ status: 'done', result: r.data }) }
    catch (e) { setAi({ status: 'error', error: e.message }) }
  }
  const download = async () => {
    setPdfBusy(true); setNotice('')
    try { await generateReport({ data, name, insights, ai: ai.status === 'done' ? ai.result : null }) }
    catch { setNotice('Could not generate the PDF report. Please try again.') }
    finally { setPdfBusy(false) }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar view={view} setView={setView} hasData={!!data} onReset={reset} />
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
        {!data ? (
          <Uploader onFile={onFile} onSample={() => load(SAMPLE_CSV, 'sample-sales.csv')} error={error} />
        ) : (
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex items-center justify-end gap-3">
              {ai.status !== 'done' && <span className="hidden text-xs text-slate-500 sm:inline">Tip: run the AI Analyst first to include recommendations in the PDF</span>}
              <button onClick={download} disabled={pdfBusy} className="btn-primary">{pdfBusy ? 'Building PDF…' : 'Download PDF report'}</button>
            </div>
            {notice && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{notice}</p>}
            {view === 'dashboard' && (
              <>
                <KPICards key={name} data={data} fileName={name} />
                <InsightsPanel insights={insights.slice(0, 4)} compact onMore={() => setView('insights')} />
                <div className="grid gap-6 lg:grid-cols-2">
                  {defaultCharts(data.columns).map((c, i) => (
                    <div key={name + i} className={c.wide ? 'lg:col-span-2' : ''}><ChartPanel columns={data.columns} records={data.records} init={c} /></div>
                  ))}
                </div>
              </>
            )}
            {view === 'insights' && <InsightsPanel insights={insights} />}
            {view === 'analyst' && <AIPanel ai={ai} onRun={runAI} mode="analyst" />}
            {view === 'recs' && <AIPanel ai={ai} onRun={runAI} mode="recs" />}
            {view === 'chat' && <><h2 className="text-xl font-semibold text-white">Ask AI about your data</h2><Chat key={name} data={data} /></>}
            {view === 'table' && <><h2 className="text-xl font-semibold text-white">Data table</h2><DataTable data={data} /></>}
            {view === 'quality' && <><h2 className="text-xl font-semibold text-white">Data quality</h2><QualityPanel data={data} /></>}
          </div>
        )}
      </main>
    </div>
  )
}
