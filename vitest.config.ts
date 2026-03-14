import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Default to node; component tests opt-in via @vitest-environment jsdom
    environment: 'node',
    globals:     true,
    setupFiles:  ['./src/test/setup.ts'],
    exclude:     ['**/node_modules/**', '**/e2e/**'],
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000' },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
