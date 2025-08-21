"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

const PUBLIC_PATHS = ["/login", "/signup"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);

  const isPublic = useMemo(() => {
    if (!pathname) return true;
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  }, [pathname]);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 비로그인 & 비공개 경로 → 로그인으로
    if (!accessToken && !isPublic) {
      const next = `${pathname}${
        searchParams?.toString() ? `?${searchParams}` : ""
      }`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    // 로그인했는데 로그인 페이지에 있으면 → next 또는 홈
    if (accessToken && pathname === "/login") {
      const next = searchParams?.get("next");
      router.replace(next || "/");
      return;
    }
    setReady(true);
  }, [accessToken, isPublic, pathname, searchParams, router]);

  if (!ready && !isPublic) {
    return (
      <div className="w-full h-[60vh] grid place-items-center text-gray-500">
        로딩 중...
      </div>
    );
  }

  return <>{children}</>;
}
