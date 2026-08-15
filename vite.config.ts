import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataRoot = path.join(root, 'data')

function serveDataDir(): Plugin {
  const mime: Record<string, string> = {
    '.json': 'application/json; charset=utf-8',
    '.geojson': 'application/geo+json; charset=utf-8',
  }

  return {
    name: 'serve-data-dir',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/data/')) {
          next()
          return
        }
        const relative = decodeURIComponent(url.replace(/^\/data\//, ''))
        const file = path.normalize(path.join(dataRoot, relative))
        if (!file.startsWith(dataRoot)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
          res.statusCode = 404
          res.end('Not found')
          return
        }
        res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream')
        fs.createReadStream(file).pipe(res)
      })
    },
    closeBundle() {
      const dest = path.join(root, 'dist', 'data')
      fs.cpSync(dataRoot, dest, { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveDataDir()],
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
    },
  },
})
