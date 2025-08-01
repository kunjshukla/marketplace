/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ipfs.io', 'gateway.ipfs.io', 'cloudflare-ipfs.com', 'via.placeholder.com'],
    unoptimized: true,
  },
}

export default nextConfig
