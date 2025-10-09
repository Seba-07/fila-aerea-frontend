/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  // Optimizaciones de rendimiento
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimizar imágenes
  images: {
    domains: [],
    formats: ['image/webp'],
  },
};

module.exports = process.env.NODE_ENV === 'production' ? withPWA(nextConfig) : nextConfig;
