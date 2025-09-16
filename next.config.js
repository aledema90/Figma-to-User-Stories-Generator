/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "s3-alpha.figma.com",
      "figma-alpha-api.s3.us-west-2.amazonaws.com",
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
