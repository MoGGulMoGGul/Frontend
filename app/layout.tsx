import "./globals.css";
import NotificationProvider from "./components/layout/NotificationContext";
import Script from "next/script";
import AuthGate from "./components/auth/AuthGate";
import AppFrame from "./components/layout/AppFrame";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {/* 방어 코드: 확장 프로그램이 body에 주입하는 속성 제거 */}
        <Script id="remove-ext-attrs" strategy="beforeInteractive">
          {`
            const targetAttrs = ['cz-shortcut-listen']; // ColorZilla
            function cleanAttrs() {
              if (!document?.body) return;
              targetAttrs.forEach(attr => {
                if (document.body.hasAttribute(attr)) {
                  document.body.removeAttribute(attr);
                }
              });
            }
            // 최초 실행
            cleanAttrs();
            // 이후 다시 붙으면 제거
            new MutationObserver(() => cleanAttrs())
              .observe(document.documentElement, { attributes: true, subtree: true });
          `}
        </Script>
        <NotificationProvider>
          <AuthGate>
            <AppFrame>{children}</AppFrame>
          </AuthGate>
        </NotificationProvider>
      </body>
    </html>
  );
}
