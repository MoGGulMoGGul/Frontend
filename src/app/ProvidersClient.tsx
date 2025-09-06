"use client";

import dynamic from "next/dynamic";

// 클라이언트에서만 로드
const NotificationProvider = dynamic(
  () => import("@/app/components/layout/NotificationContext"),
  { ssr: false }
);
const AuthBootstrap = dynamic(
  () => import("@/app/components/auth/AuthBootstrap"),
  { ssr: false }
);
const AuthGate = dynamic(() => import("@/app/components/auth/AuthGate"), {
  ssr: false,
  loading: () => null,
});

type Props = { children: React.ReactNode };

export default function ProvidersClient({ children }: Props) {
  return (
    <NotificationProvider>
      <AuthBootstrap />
      <AuthGate>{children}</AuthGate>
    </NotificationProvider>
  );
}
