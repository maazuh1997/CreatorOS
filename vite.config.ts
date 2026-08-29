import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { cloudflare } from '@cloudflare/vite-plugin'
import vinext from 'vinext/plugin'

export default defineConfig({
  plugins: [
    vinext(),
    react(),
    rsc(),
    cloudflare({
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    }),
  ],
})
