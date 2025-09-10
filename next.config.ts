import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for "Module not found: Can't resolve 'async_hooks'"
    // This is a server-side module that some dependencies try to use on the client.
    // We can safely mock it for the client build.
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            async_hooks: false,
        };
    }

    return config;
  },
};

export default nextConfig;
