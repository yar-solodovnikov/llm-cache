import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['tests/integration/**', '**/node_modules/**'],
  },
})
