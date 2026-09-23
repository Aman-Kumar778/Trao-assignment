/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@traq/shared"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false
      }
    ];
  }
};

module.exports = nextConfig;
