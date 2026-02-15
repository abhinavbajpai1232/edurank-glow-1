/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Image optimization
  images: {
    unoptimized: false,
  },
  // Enable SWC minification
  experimental: {
    optimizePackageImports: ['@radix-ui/react-*'],
  },
};

module.exports = nextConfig;
