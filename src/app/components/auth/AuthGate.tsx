"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

const PUBLIC_PATHS = ["/login", "/signup"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const isPublic = useMemo(() => {
    if (!pathname) return true;
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  }, [pathname]);

  const [ready, setReady] = useState(isPublic);
  const triedRefresh = useRef(false);

  //하이드레이션이 끝난후, 보호 경로인데 액세스/리프레시 둘 다 없으면 즉시 로그인으로
  useEffect(() => {
    if (!hasHydrated) return;
    console.log("[AuthGate]", {
      hasHydrated,
      accessToken,
      refreshToken,
      pathname,
    });
    if (isPublic) return;

    if (!accessToken && !refreshToken) {
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      const next = `${pathname ?? ""}${search ?? ""}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return; // 여기서 끝
    }
  }, [hasHydrated, isPublic, accessToken, refreshToken, pathname, router]);

  useEffect(() => {
    if (!hasHydrated) return;

    // 공개 경로는 바로 렌더
    if (isPublic) {
      setReady(true);
      return;
    }

    // 액세스 토큰 있으면 렌더
    if (accessToken) {
      setReady(true);
      return;
    }

    // 여기부터 보호 경로 + 액세스 없음 (리프레시 있으면 한 번 시도)
    const doWork = async () => {
      if (refreshToken && !triedRefresh.current) {
        triedRefresh.current = true;
        try {
          await useAuthStore.getState().refreshTokens();
        } catch {
          // 실패해도 아래에서 처리
        }
      }

      const tokenNow = useAuthStore.getState().accessToken;
      if (!tokenNow) {
        const search =
          typeof window !== "undefined" ? window.location.search : "";
        const next = `${pathname ?? ""}${search ?? ""}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      setReady(true);
    };

    void doWork();
  }, [accessToken, isPublic, pathname, router, hasHydrated, refreshToken]);

  if (!ready && !isPublic) {
    return (
      <div className="w-full h-[60vh] grid place-items-center text-gray-500">
        로딩 중...
      </div>
    );
  }

  return <>{children}</>;
}
