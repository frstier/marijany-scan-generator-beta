import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ВАЖЛИВО: Назва репозиторію має бути в слешах /.../
  base: '/marijany-scan-generator-beta/',
})