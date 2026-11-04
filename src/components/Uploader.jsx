import { useRef, useState } from 'react'

export default function Uploader({ onFile, onSample, error }) {
  const [drag, setDrag] = useState(false)
  const input = useRef()
  const drop = (e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]) }
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center rise">
      <h1 className="text-3xl font-bold text-white sm:text-4xl">Turn any CSV into a dashboard</h1>
      <p className="mt-3 text-slate-400">Drop a file and get KPIs, charts, a searchable table, and a data quality check in seconds.</p>
      <div role="button" tabIndex={0} onClick={() => input.current.click()} onKeyDown={(e) => e.key === 'Enter' && input.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={drop}
        className={`mt-10 w-full cursor-pointer rounded-2xl border-2 border-dashed p-12 transition ${drag ? 'border-accent bg-accent/10' : 'border-white/15 bg-navy-800/50 hover:border-accent/60'}`}>
        <svg className="mx-auto h-10 w-10 text-accent-soft" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></svg>
        <p className="mt-4 font-medium text-white">{drag ? 'Release to upload' : 'Drag and drop a CSV file here'}</p>
        <p className="mt-1 text-sm text-slate-500">or click to browse (max 10 MB)</p>
        <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = '' }} />
      </div>
      {error && <p role="alert" className="mt-4 w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-left text-sm text-red-300">{error}</p>}
      <button onClick={onSample} className="btn-primary mt-6">Try the sample sales data</button>
    </div>
  )
}
