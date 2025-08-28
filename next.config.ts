const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,

  images: {
    unoptimized: true, // S3/CloudFront 정적 배포에 필수
    remotePatterns: [
      {
        protocol: "https",
        hostname: "moggulmoggul-frontend.s3.ap-northeast-2.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
