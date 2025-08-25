"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";

import Main from "@/app/components/Main";
import ModalDetailContent from "@/app/components/modal/ModalDetailContent";
import SearchBar from "@/app/components/common/SearchBar";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // modal 쿼리 파라미터를 숫자로 안전 변환
  const modalId = useMemo(() => {
    const raw = searchParams.get("modal");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  return (
    <>
      {/* 검색어 입력 시 /search로 이동 (scope=public) */}
      <SearchBar
        placeholder="전체 꿀팁 검색"
        onSearch={(q) => {
          const keyword = (q ?? "").trim();
          if (!keyword) return;
          const params = new URLSearchParams({ scope: "public", q: keyword });
          router.push(`/search?${params.toString()}`);
        }}
      />

      {/* 피드 */}
      <Main />

      {/* 모달: ?modal=123 일 때만 표시 */}
      {modalId !== null && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-background p-6 rounded-xl shadow-xl max-w-[min(90vw,720px)] w-full">
            <ModalDetailContent id={modalId} onClose={() => router.back()} />
          </div>
        </div>
      )}
    </>
  );
}
