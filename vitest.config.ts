import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      exclude: ['src/lib/db/migrations/**'],
      thresholds: {
        lines: 80,
        branches: 80,
        'src/lib/config.ts': {
          branches: 90,
          lines: 80,
        },
        'src/lib/logger.ts': {
          branches: 90,
          lines: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
