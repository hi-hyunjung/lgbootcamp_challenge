import { fileURLToPath } from 'url';
import createJiti from 'jiti';

import * as i18nConfig from './next-i18next.config.js';

createJiti(fileURLToPath(import.meta.url))('./src/env');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: process.env.NODE_ENV === 'production',
  reactStrictMode: false,
  i18n: i18nConfig.default.i18n,
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['@ufb/react'],
  // compiler: { removeConsole: process.env.NODE_ENV === 'production' },
  compiler: { removeConsole: false },
  images: { remotePatterns: [{ hostname: '*' }], path: '/_next/image' },
  productionBrowserSourceMaps: true,
};

export default nextConfig;
