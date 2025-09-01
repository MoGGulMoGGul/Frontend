import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import NotificationProvider from "@/app/components/layout/NotificationContext";
import AuthGate from "@/app/components/auth/AuthGate";
import AppFrame from "@/app/components/layout/AppFrame";
import AlarmConsole from "./components/realtime/AlarmConsole";
import AuthBootstrap from "./components/auth/AuthBootstrap";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "모꿀모꿀",
  description: "모꿀모꿀 — 꿀팁 아카이브",
  // 필요하면 파비콘도 여기서 명시:
  // icons: { icon: [{ url: "/favicon.ico", sizes: "any" }] },
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
        {/* 방어 코드: 확장 프로그램이 body에 주입하는 속성 제거 */}
        <Script id="remove-ext-attrs" strategy="beforeInteractive">
          {`
            const targetAttrs = ['cz-shortcut-listen']; // ColorZilla 등
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
          <AuthBootstrap />
          <AuthGate>
            <AppFrame>
              <AlarmConsole />
              {children}
            </AppFrame>
          </AuthGate>
        </NotificationProvider>
      </body>
    </html>
  );
}
