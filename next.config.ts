import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isWindows = process.platform === 'win32';

const nextConfig: NextConfig = {
  // Use standalone output for Docker and Linux CI builds.
  // On local Windows host without admin/Developer Mode, default to standard build to prevent symlink EPERM.
  output: isWindows && !process.env.STANDALONE ? undefined : 'standalone',
  serverExternalPackages: ['pino', 'pg', 'ioredis', 'bullmq', 'drizzle-orm'],
};

export default withNextIntl(nextConfig);
