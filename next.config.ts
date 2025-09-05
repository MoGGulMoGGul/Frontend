import type { NextConfig } from "next";

const isLHCI = process.env.LHCI === "true";

// 디버깅 로그 (빌드 시 콘솔에 찍힘)
console.log(`[next.config] LHCI=${process.env.LHCI} → isLHCI=${isLHCI}`);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,

  // LHCI 모드일 땐 서버 빌드(= export 끔), 그 외엔 기존처럼 export 유지
  ...(isLHCI ? {} : { output: "export" }),

  images: {
    unoptimized: true,
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
