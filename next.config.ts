import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://3.39.198.133:8080/api/:path*",
      },
    ];
  },

  images: {
    // 개발/배포 둘 다 등록
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.yourdomain.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
