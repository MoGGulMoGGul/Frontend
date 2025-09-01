"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

const PUBLIC_PATHS = ["/login", "/signup"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // 현재 경로가 공개 경로인지
  const isPublic = useMemo(() => {
    if (!pathname) return true;
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  }, [pathname]);

  const [ready, setReady] = useState<boolean>(isPublic);
  const triedRefresh = useRef(false);
  const unmounted = useRef(false);

  // 언마운트 플래그
  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  // 경로가 바뀌면 public 여부에 따라 ready 초기화
  useEffect(() => {
    setReady(isPublic);
  }, [isPublic]);

  // 하이드레이션 완료 전엔 아무것도 안 함 (중요!)
  useEffect(() => {
    if (!hasHydrated) return;

    // 공개 경로는 즉시 렌더
    if (isPublic) {
      setReady(true);
      return;
    }

    // 보호 경로
    // 1) access 있으면 통과
    if (accessToken) {
      setReady(true);
      return;
    }

    // 2) access 없고 refresh 없으면 로그인으로
    if (!refreshToken) {
      const next = buildNext(pathname, searchParams);
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    // 3) access 없고 refresh 있으면 1회 리프레시 시도
    const work = async () => {
      if (triedRefresh.current) {
        // 이미 시도했는데도 토큰 없으면 로그인
        const tokenNow = useAuthStore.getState().accessToken;
        if (!tokenNow) {
          const next = buildNext(pathname, searchParams);
          router.replace(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        // 토큰 생겼다면 통과
        if (!unmounted.current) setReady(true);
        return;
      }

      triedRefresh.current = true;
      try {
        await useAuthStore.getState().refreshTokens();
      } catch {
        // 실패 → 로그인
        const next = buildNext(pathname, searchParams);
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      // 성공 시 토큰 확인 후 통과
      const tokenNow = useAuthStore.getState().accessToken;
      if (!tokenNow) {
        const next = buildNext(pathname, searchParams);
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!unmounted.current) setReady(true);
    };

    void work();
  }, [
    hasHydrated,
    isPublic,
    accessToken,
    refreshToken,
    pathname,
    searchParams,
    router,
  ]);

  if (!ready && !isPublic) {
    return (
      <div className="w-full h-[60vh] grid place-items-center text-gray-500">
        로딩 중...
      </div>
    );
  }

  return <>{children}</>;
}

function buildNext(
  pathname: string | null,
  searchParams: ReturnType<typeof useSearchParams>
) {
  const search = searchParams?.toString();
  return `${pathname ?? ""}${search ? `?${search}` : ""}`;
}
