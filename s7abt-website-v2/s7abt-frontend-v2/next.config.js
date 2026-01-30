const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Add this for external images
    unoptimized: true,
  },
  // Experimental features
  experimental: {
    // isrMemoryCacheSize removed - deprecated in Next.js 14+
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Mark pages as dynamic
  staticPageGenerationTimeout: 0,
};

module.exports = withNextIntl(nextConfig);

