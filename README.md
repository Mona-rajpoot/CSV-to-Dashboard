# CSV2Dashboard

Upload a CSV and get KPIs, interactive charts, a searchable table, and a data quality report. Runs entirely in the browser; no data leaves the user's machine.

**Stack:** React 18, Vite, Tailwind CSS 3, Chart.js 4.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
```

## Deploy
**GitHub**
```bash
git init && git add . && git commit -m "CSV2Dashboard MVP"
git branch -M main
git remote add origin https://github.com/<you>/csv2dashboard.git
git push -u origin main
```
**Vercel:** import the repo at vercel.com/new. The Vite preset is detected (`npm run build`, output `dist`). No environment variables needed.

## Structure
```
src/
  App.jsx                 state + routing between views
  components/             Sidebar, Uploader, KPICards, ChartPanel, DataTable, QualityPanel
  utils/csv.js            CSV parser + validation
  utils/analyze.js        type detection, stats, aggregation, quality checks
  data/sample.js          demo sales dataset
```

## AI setup (free)
1. Get a free Gemini API key at https://aistudio.google.com/apikey
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY=...` (never commit `.env`). Optional: `GEMINI_MODEL`.
3. `npm install` then `npm run dev`. AI calls go through `/api/ai`, so the key stays on the server.
4. Vercel: Project Settings > Environment Variables > add `GEMINI_API_KEY`, then redeploy.

**Privacy:** AI features send only a statistical summary and 8 sample rows to Google Gemini, and only when the user clicks them.
