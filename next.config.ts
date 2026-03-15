import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  serverExternalPackages: [],

  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },

    // Fix large uploads
    proxyClientMaxBodySize: '100mb',
  },
};

export default nextConfig;