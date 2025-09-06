import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

import AppFrame from "@/app/components/layout/AppFrame";
import AuthReadyFlag from "./components/system/AuthReadyFlag";
import localFont from "next/font/local";
import ProvidersClient from "./ProvidersClient"; // ★ 추가: 클라이언트 래퍼

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "모꿀모꿀",
  description: "모꿀모꿀 — 꿀팁 아카이브",
};

const pretendard = localFont({
  src: [{ path: "./fonts/Pretendard-Regular.woff2", style: "normal" }],
  variable: "--font-pretendard",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/Pretendard-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pretendard.variable} antialiased`}
        suppressHydrationWarning
      >
        <Script id="remove-ext-attrs" strategy="lazyOnload">
          {`
            (function () {
              const targetAttrs = ['cz-shortcut-listen'];
              function cleanAttrs() {
                if (!document?.body) return;
                for (const attr of targetAttrs) {
                  if (document.body.hasAttribute(attr)) {
                    document.body.removeAttribute(attr);
                  }
                }
              }
              (window.requestIdleCallback || setTimeout)(cleanAttrs, 1);
            })();
          `}
        </Script>

        {/* 클라이언트 전용 트리 안으로 AppFrame+children을 넣어줌 */}
        <ProvidersClient>
          <Suspense
            fallback={
              <div className="w-full h-[60vh] grid place-items-center text-gray-500">
                로딩 중...
              </div>
            }
          >
            <AppFrame>{children}</AppFrame>
          </Suspense>
          <AuthReadyFlag />
        </ProvidersClient>
      </body>
    </html>
  );
}
