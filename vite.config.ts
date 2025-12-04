import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ВАЖЛИВО: Замініть 'REPO_NAME' на назву вашого репозиторію
  base: 'marijany-scan-generator-beta',
})