"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AuthBootstrap() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const refreshTokens = useAuthStore((s) => s.refreshTokens);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);

  useEffect(() => {
    if (!hasHydrated) return;

    (async () => {
      try {
        if (!accessToken && refreshToken) {
          await refreshTokens(); // ← 새 액세스 토큰 발급
        }
      } catch (e) {
        // 실패해도 흐름 계속 (authReady만 true로)
        // 필요하면 여기서 refreshToken 지우는 정책도 가능
        console.warn("[AuthBootstrap] refresh failed", e);
      } finally {
        setAuthReady(true);
      }
    })();
  }, [hasHydrated, accessToken, refreshToken, refreshTokens, setAuthReady]);

  return null;
}
