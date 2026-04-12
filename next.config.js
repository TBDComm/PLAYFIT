/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/articles', destination: '/blog', permanent: true },
      { source: '/articles/:slug', destination: '/blog/:slug', permanent: true },
    ]
  },
}

if (process.env.NODE_ENV === 'development') {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev')
  setupDevPlatform()
}

module.exports = nextConfig
