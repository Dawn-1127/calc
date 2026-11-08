import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/pkg/cpp-core/**/*.ts', 'src/pkg/cpp-arknights/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
  },
})
