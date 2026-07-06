/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // church logos can live on any URL
    ],
  },
};

export default nextConfig;
