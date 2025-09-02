"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import Sidebar from "./Sidebar";

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);

  const hideSidebar =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    !accessToken;

  if (hideSidebar) {
    // 로그인 전/로그인 페이지: 사이드바 없이 콘텐츠만
    return (
      <main className="flex-1 px-6">
        <div className="max-w-screen-xl mx-auto">{children}</div>
      </main>
    );
  }

  // 로그인 후: 사이드바 + 메인
  return (
    <div className="flex w-full overflow-hidden relative">
      <aside className="w-[236px] xl:w-[260px] 2xl:w-[300px] flex-shrink-0 relative z-10">
        <Sidebar />
      </aside>
      <main className="flex-1 px-4 xl:px-6 2xl:px-8">
        <div className="mx-auto max-w-screen-xl 2xl:max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
