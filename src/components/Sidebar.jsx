export const NAV = [
  { id: 'dashboard', label: 'Dashboard', short: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { id: 'insights', label: 'Insights', short: 'Insights', icon: 'M3 17l6-6 4 4 8-8M15 7h6v6' },
  { id: 'analyst', label: 'AI Analyst', short: 'AI', icon: 'M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z' },
  { id: 'recs', label: 'Recommendations', short: 'Actions', icon: 'M9 18h6m-5 3h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.4 1 2.5h6c0-1.1.3-1.8 1-2.5A6 6 0 0012 3z' },
  { id: 'chat', label: 'Ask AI', short: 'Ask AI', icon: 'M8 10h8M8 14h5m-9 6l2-3H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14z' },
  { id: 'table', label: 'Data table', short: 'Table', icon: 'M3 5h18v14H3V5zm0 5h18M9 5v14' },
  { id: 'quality', label: 'Data quality', short: 'Quality', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
]
const Icon = ({ d }) => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
)

export default function Sidebar({ view, setView, hasData, onReset }) {
  const item = (n) => (
    <button key={n.id} disabled={!hasData} onClick={() => setView(n.id)}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${view === n.id && hasData ? 'bg-accent/15 text-accent-soft' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
      <Icon d={n.icon} />{n.label}
    </button>
  )
  return (
    <>
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/10 bg-navy-950 p-4">
        <div className="mb-8 flex items-center gap-2 px-2 text-lg font-bold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent"><svg className="h-5 w-5" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M6 18v-6m6 6V6m6 12v-4" /></svg></span>
          CSV2Dashboard
        </div>
        <nav className="flex flex-col gap-1">{NAV.map(item)}</nav>
        <div className="mt-auto">
          {hasData && <button onClick={onReset} className="btn-ghost w-full">Reset dashboard</button>}
          <p className="mt-4 px-2 text-xs text-slate-500">Charts and tables run in your browser. AI features send a data summary to Google Gemini only when you click them.</p>
        </div>
      </aside>
      <header className="md:hidden flex items-center justify-between border-b border-white/10 bg-navy-950 px-4 py-3">
        <span className="mr-2 shrink-0 font-bold text-white">CSV2Dashboard</span>
        {hasData && (
          <div className="flex gap-1 overflow-x-auto">
            {NAV.map((n) => <button key={n.id} onClick={() => setView(n.id)} className={`rounded-md px-2 py-1 text-xs ${view === n.id ? 'bg-accent/20 text-accent-soft' : 'text-slate-400'}`}>{n.short}</button>)}
            <button onClick={onReset} className="rounded-md px-2 py-1 text-xs text-slate-400">Reset</button>
          </div>
        )}
      </header>
    </>
  )
}
