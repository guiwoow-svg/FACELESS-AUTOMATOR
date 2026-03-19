import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000
const API_KEY = process.env.ANTHROPIC_API_KEY

if (!API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY não definida nas variáveis de ambiente.')
  process.exit(1)
}

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Rate limit. Aguarde 1 minuto.' },
}))

// Proxy para Anthropic — injeta a chave server-side
app.use('/api/anthropic', createProxyMiddleware({
  target: 'https://api.anthropic.com',
  changeOrigin: true,
  pathRewrite: { '^/api/anthropic': '' },
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.setHeader('x-api-key', API_KEY)
      proxyReq.setHeader('anthropic-version', '2023-06-01')
    },
    error: (err, req, res) => {
      console.error('Proxy error:', err.message)
      res.status(502).json({ error: 'Erro ao conectar com Anthropic.' })
    },
  },
}))

// Serve o frontend buildado
app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  Faceless Automator rodando em http://0.0.0.0:${PORT}`)
})
