/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['echarts', 'zrender', 'echarts-for-react'],
  optimizeFonts: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['*'],
    },
    optimizePackageImports: [
      'lucide-react',
      'echarts',
      'reactflow',
      'recharts',
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8008/api/v1/:path*',
      },
      {
        source: '/ai/:path*',
        destination: 'http://localhost:8008/api/v1/ai/:path*',
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/dashboard/simulation',
        destination: '/dashboard/simulation-lab',
        permanent: false,
      },
    ];
  },

  poweredByHeader: false,
};

export default nextConfig;