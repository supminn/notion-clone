/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gphdxhllcetucvvovotc.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
