/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/games/crates',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
