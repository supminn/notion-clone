/** @type {import('next').NextConfig} */
const nextConfig = {
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
