import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['lucide-react', 'react-qr-code'],
  webpack: (config) => {
    // Resolve modules from portal's own node_modules for shared components
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
    ]
    return config
  },
}

export default nextConfig
