import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

import NotificationProvider from "@/app/components/layout/NotificationContext";
import AuthGate from "@/app/components/auth/AuthGate";
import AppFrame from "@/app/components/layout/AppFrame";
import AuthBootstrap from "@/app/components/auth/AuthBootstrap";
import AuthReadyFlag from "./components/system/AuthReadyFlag";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "모꿀모꿀",
  description: "모꿀모꿀 — 꿀팁 아카이브",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Script id="remove-ext-attrs" strategy="beforeInteractive">
          {`
            const targetAttrs = ['cz-shortcut-listen'];
            function cleanAttrs() {
              if (!document?.body) return;
              targetAttrs.forEach(attr => {
                if (document.body.hasAttribute(attr)) {
                  document.body.removeAttribute(attr);
                }
              });
            }
            cleanAttrs();
            new MutationObserver(() => cleanAttrs())
              .observe(document.documentElement, { attributes: true, subtree: true });
          `}
        </Script>

        <NotificationProvider>
          <Suspense
            fallback={
              <div className="w-full h-[60vh] grid place-items-center text-gray-500">
                로딩 중...
              </div>
            }
          >
            <AuthBootstrap />
            <AuthGate>
              <AppFrame>{children}</AppFrame>
            </AuthGate>
            <AuthReadyFlag />
          </Suspense>
        </NotificationProvider>
      </body>
    </html>
  );
}
