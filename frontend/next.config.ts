import type { NextConfig } from "next";

// @ts-ignore
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ url }) => {
          return !url.pathname.startsWith('/api/');
        },
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'offlineCache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: ({ url }) => url.origin === 'https://quickchart.io',
        handler: 'CacheFirst',
        options: {
          cacheName: 'qrCache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {}, // disable turbopack errors due to next-pwa webpack integrations
  async rewrites() {
    return [
      {
        // Force IPv4 loopback on stable port 8000 to avoid Node.js IPv6 ECONNREFUSED bugs
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ];
  },
};

export default withPWA(nextConfig);
