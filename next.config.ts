import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pino', 'pg', 'ioredis', 'bullmq', 'drizzle-orm'],
};

export default nextConfig;
