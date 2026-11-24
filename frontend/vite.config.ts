import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Alias @/ -> src/ (el mismo alias está declarado en tsconfig.app.json)
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
