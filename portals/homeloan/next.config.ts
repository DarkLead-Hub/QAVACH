import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['lucide-react', 'react-qr-code'],
  webpack: (config) => {
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
    ]
    return config
  },
}

export default nextConfig
