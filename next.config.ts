import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.18.3',
    '192.168.18.230',
    '192.168.18.228',
    '192.168.18.248',
    '192.168.1.1',
    'localhost',
    '127.0.0.1',
    '*.local',
  ],
};

export default nextConfig;
