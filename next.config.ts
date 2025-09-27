import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Optimize for production
  // Enable experimental features for better performance
  experimental: { optimizeCss: false },

  // Optimize images
  images: {
    unoptimized: true, // For Vercel deployment
  },
};

export default nextConfig;
