"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import SearchBar from "@/app/components/common/SearchBar";
import HexGridWithData, {
  type HexItem,
} from "@/app/components/grid/HexGridWithData";
import { MYTIP_IMAGE_SLOTS } from "@/app/components/grid/TipImageSlots";
import ModalDetailContent from "@/app/components/modal/ModalDetailContent";
import { getStorageTips } from "@/lib/storage";

export default function MyDetailTipPage() {
  const router = useRouter();

  // 쿼리에서 storageNo 읽기 (정적 배포 호환)
  const storageNo = useMemo(() => {
    if (typeof window === "undefined") return NaN;
    const sp = new URLSearchParams(window.location.search);
    return Number(sp.get("storageNo") ?? NaN);
  }, []);

  if (!Number.isFinite(storageNo)) {
    return <main className="p-6">잘못된 경로입니다.</main>;
  }

  // HexGrid 매퍼 (원본 유지)
  const mapItem = (t: { id: number; title?: string }): HexItem => ({
    id: t.id,
    label: t.title || "(제목 없음)",
  });

  return (
    <>
      {/* 검색: 입력 시 /search로 이동 */}
      <SearchBar
        placeholder="이 보관함에서 꿀팁 검색"
        onSearch={(q) => {
          const keyword = (q ?? "").trim();
          if (!keyword) return;
          const params = new URLSearchParams({
            scope: "storage",
            storageId: String(storageNo),
            q: keyword,
          });
          router.push(`/search?${params.toString()}`);
        }}
      />

      <div className="p-6 pt-0">
        {/* 기본 모드: 해당 보관함 꿀팁 목록 */}
        <HexGridWithData<{ id: number; title?: string }>
          fetcher={() => getStorageTips(storageNo)}
          mapItem={mapItem}
          imageSlotConfig={MYTIP_IMAGE_SLOTS}
          totalSlots={30}
          cols={5}
          emptyBg="#D9D9D9"
          onCardClick={(id) => {
            // 기존 쿼리 유지 + modal만 추가
            const sp = new URLSearchParams(window.location.search);
            sp.set("modal", String(id));
            router.push(`?${sp.toString()}`);
          }}
        />

        {/* 얇은 모달 레이어: useSearchParams 사용 */}
        <Suspense fallback={null}>
          <ModalLayer />
        </Suspense>
      </div>
    </>
  );
}

function ModalLayer() {
  const router = useRouter();
  const sp = useSearchParams();
  const modalId = sp.get("modal");

  if (!modalId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <ModalDetailContent
          id={parseInt(modalId)}
          onClose={() => router.back()}
        />
      </div>
    </div>
  );
}
