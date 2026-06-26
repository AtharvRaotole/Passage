/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler:
    process.env.NODE_ENV === 'production'
      ? { removeConsole: { exclude: ['error', 'warn'] } }
      : undefined,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
  },
}

module.exports = nextConfig

