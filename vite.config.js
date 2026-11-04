import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev only: serves /api/ai locally using the same handler Vercel runs in production.
const devApi = (env) => ({
  name: 'dev-api',
  configureServer(server) {
    Object.assign(process.env, env)
    server.middlewares.use('/api/ai', async (req, res) => {
      const chunks = []
      for await (const c of req) chunks.push(c)
      try { req.body = JSON.parse(Buffer.concat(chunks).toString() || '{}') } catch { req.body = {} }
      const { default: handler } = await server.ssrLoadModule('/api/ai.js')
      handler(req, res)
    })
  },
})
export default defineConfig(({ mode }) => ({ plugins: [react(), devApi(loadEnv(mode, process.cwd(), ''))] }))
