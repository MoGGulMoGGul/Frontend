"use client";

import Main from "./components/Main";
import { useSearchParams, useRouter } from "next/navigation";
import ModalDetailContent from "./components/modal/ModalDetailContent";
import SearchBar from "./components/common/SearchBar";

export default function Home() {
  const searchParams = useSearchParams();
  const modalId = searchParams.get("modal");
  const router = useRouter();

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

      {/* 항상 공개 피드만 표시 */}
      <Main />

      {modalId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <ModalDetailContent
              id={parseInt(modalId)}
              onClose={() => router.back()}
            />
          </div>
        </div>
      )}
    </>
  );
}
