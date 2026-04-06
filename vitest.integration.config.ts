import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/integration/**/*.spec.ts',
      'tests/integration/**/*.test.ts'
    ],
    exclude: [
      'node_modules/',
      'tests/unit/',
      'tests/e2e/',
      '**/*.d.ts',
      '**/*.config.*'
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
    isolate: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
})
