import type { NextConfig } from 'next';

const isWindows = process.platform === 'win32';

const nextConfig: NextConfig = {
  // Use standalone output for Docker and Linux CI builds.
  // On local Windows host without admin/Developer Mode, default to standard build to prevent symlink EPERM.
  output: isWindows && !process.env.STANDALONE ? undefined : 'standalone',
  serverExternalPackages: ['pino', 'pg', 'ioredis', 'bullmq', 'drizzle-orm'],
};

export default nextConfig;
