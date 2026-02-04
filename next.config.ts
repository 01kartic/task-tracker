import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  assetPrefix: './',
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['@tabler/icons-react', 'recharts', 'date-fns', 'react-day-picker'],
  },
  compress: true,
};

export default nextConfig;
