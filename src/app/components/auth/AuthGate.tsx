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
  const triedRefresh = useRef(false); // 새로고침 직후 1회만 리프레시 시도

  useEffect(() => {
    // 로컬스토리지 복원되기 전엔 아무 것도 하지 않음
    if (!hasHydrated) return;

    // 공개 경로는 바로 렌더
    if (isPublic) {
      setReady(true);
      return;
    }

    // 이미 accessToken 있으면 패스
    if (accessToken) {
      setReady(true);
      return;
    }

    // 여기서부터: 비공개 경로 + accessToken 없음
    const doWork = async () => {
      if (refreshToken && !triedRefresh.current) {
        triedRefresh.current = true;
        try {
          await useAuthStore.getState().refreshTokens(); // ⚡ 토큰 재발급 시도
        } catch {
          // 실패해도 흐름 계속
        }
      }

      // 갱신 결과 재확인
      const tokenNow = useAuthStore.getState().accessToken;
      if (!tokenNow) {
        const search =
          typeof window !== "undefined" ? window.location.search : "";
        const next = `${pathname ?? ""}${search ?? ""}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
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
