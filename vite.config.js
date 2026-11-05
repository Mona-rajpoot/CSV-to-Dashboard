import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Reads .env fresh on every request, so changes apply without restarting the server
const readEnv = () => {
  try {
    return Object.fromEntries(
      fs.readFileSync('.env', 'utf8').split(/\r?\n/)
        .map((l) => l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/))
        .filter(Boolean)
        .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]),
    )
  } catch { return {} }
}

// Dev only: serves /api/ai locally using the same handler Vercel runs in production.
const devApi = () => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use('/api/ai', async (req, res) => {
      Object.assign(process.env, readEnv())
      const chunks = []
      for await (const c of req) chunks.push(c)
      try { req.body = JSON.parse(Buffer.concat(chunks).toString() || '{}') } catch { req.body = {} }
      const { default: handler } = await server.ssrLoadModule('/api/ai.js')
      handler(req, res)
    })
  },
})
export default defineConfig({ plugins: [react(), devApi()] })
