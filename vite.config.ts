import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type PluginOption } from 'vite'
import svgr from 'vite-plugin-svgr'

const chunks = {
  'game-arknights': [/\/src\/components\/arknights\//, /\/src\/pkg\/cpp-arknights\//],
} as Record<string, RegExp[]>

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/calc/',
  plugins: [react(), visualizer() as PluginOption, svgr()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id, meta) => {
          if (isCSSRequest(id)) return

          if (isInNodeModules(id)) {
            return 'vendor'
          }

          for (const chunk in chunks) {
            if (chunks[chunk].some((regex) => regex.test(id))) {
              return chunk || null
            }
          }

          if (id.includes('/po/') && id.endsWith('.json')) {
            return 'po-' + id.split('/po/')[1].replace(/\.json$/, '')
          }

          if (id[0] !== '/') return null
          return 'app'
        },
      },
    },
  },
}))

const CSS_LANGS_RE =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/
const isCSSRequest = (request: string): boolean => CSS_LANGS_RE.test(request)

function isInNodeModules(id: string): boolean {
  return id.includes('node_modules')
}
