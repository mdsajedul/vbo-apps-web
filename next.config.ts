import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/erp',
        permanent: true,
      },
      {
        source: '/pos',
        destination: '/erp/pos',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

