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
      <aside className="w-[250px] flex-shrink-0 relative z-10">
        <Sidebar />
      </aside>
      <main className="flex-1 px-6">
        <div className="max-w-screen-xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
