import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// One ID per deploy. Railway provides the commit SHA at build time;
// the timestamp fallback covers local builds.
const BUILD_ID =
  (process.env.RAILWAY_GIT_COMMIT_SHA || '').slice(0, 12) || Date.now().toString(36)

// After the build: write dist/version.json and stamp the build ID into dist/sw.js.
// Changing sw.js bytes on every deploy is what makes phones install the new worker.
function buildStamp() {
  let outDir = 'dist'
  return {
    name: 'rbt-build-stamp',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    writeBundle() {
      fs.writeFileSync(path.join(outDir, 'version.json'), JSON.stringify({ version: BUILD_ID }))
      const swPath = path.join(outDir, 'sw.js')
      if (fs.existsSync(swPath)) {
        const sw = fs.readFileSync(swPath, 'utf8').replaceAll('__BUILD_ID__', BUILD_ID)
        fs.writeFileSync(swPath, sw)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), buildStamp()],
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_ID),
  },
})
