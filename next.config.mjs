/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Prevent browser from timing out while dev server is performing cold compilation
      config.output = config.output || {};
      config.output.chunkLoadTimeout = 300000; // 300 seconds (5 minutes)
    }
    return config;
  },
};

export default nextConfig;

