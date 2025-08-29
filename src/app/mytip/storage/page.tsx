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
  const sp = useSearchParams();

  // 훅들 최상단 고정
  const storageNoParam = sp.get("storageNo");
  const storageNo = useMemo(
    () => (storageNoParam == null ? null : Number(storageNoParam)),
    [storageNoParam]
  );

  // 이후에 분기
  if (storageNo === null) {
    return <main className="p-6">불러오는 중...</main>;
  }
  if (!Number.isFinite(storageNo)) {
    return <main className="p-6">잘못된 경로입니다.</main>;
  }

  const mapItem = (t: { id: number; title?: string }): HexItem => ({
    id: t.id,
    label: t.title || "(제목 없음)",
  });

  return (
    <>
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
        <HexGridWithData<{ id: number; title?: string }>
          fetcher={() => getStorageTips(storageNo)}
          mapItem={mapItem}
          imageSlotConfig={MYTIP_IMAGE_SLOTS}
          totalSlots={30}
          cols={5}
          emptyBg="#D9D9D9"
          onCardClick={(id) => {
            const next = new URLSearchParams(sp.toString());
            next.set("modal", String(id));
            router.push(`?${next.toString()}`);
          }}
        />

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
