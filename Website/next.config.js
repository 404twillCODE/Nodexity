/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/Nodexity' : '';

const nextConfig = {
  reactStrictMode: true,
  // No output: 'export' — forum and auth need a Node server (dynamic routes, Supabase)
  images: {
    unoptimized: true,
  },
  basePath: basePath,
  assetPrefix: basePath,
};

module.exports = nextConfig;

