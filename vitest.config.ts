import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./tests/unit/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/config.ts',
        'src/lib/logger.ts',
        'src/lib/theme.ts',
        'src/lib/request-context.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        'src/lib/config.ts': {
          branches: 70,
          lines: 80,
        },
        'src/lib/logger.ts': {
          branches: 80,
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
