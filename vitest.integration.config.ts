import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 15_000,
    hookTimeout: 30_000,
    reporters: ['verbose'],
    pool: 'forks',
  },
})
