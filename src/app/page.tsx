"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";

import HexGridWithData, {
  type HexItem,
} from "@/app/components/grid/HexGridWithData";
import { getPublicTips, type PublicTipItem } from "@/lib/tips";
import { MYTIP_IMAGE_SLOTS } from "@/app/components/grid/TipImageSlots";
import SearchBar from "@/app/components/common/SearchBar";
import ModalDetailContent from "@/app/components/modal/ModalDetailContent";

const mapPublicTipItem = (t: PublicTipItem): HexItem => ({
  id: t.no,
  label: t.title || "(제목 없음)",
});

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ?modal=123 처리
  const modalId = useMemo(() => {
    const raw = searchParams.get("modal");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const openModal = (id: number) => router.push(`?modal=${id}`);

  return (
    <>
      {/* Challenge/MyTip과 동일한 폭 제한 컨테이너 + 가로 넘침 클립 */}
      <div className="w-full max-w-screen-xl mx-auto px-6">
        <SearchBar
          placeholder="전체 꿀팁 검색"
          onSearch={(q) => {
            const keyword = (q ?? "").trim();
            if (!keyword) return;
            const params = new URLSearchParams({ scope: "public", q: keyword });
            router.push(`/search?${params.toString()}`);
          }}
        />
        <div className="relative p-6 pt-0">
          <main className="relative">
            <div className="relative overflow-x-clip">
              <HexGridWithData<PublicTipItem>
                fetcher={getPublicTips}
                mapItem={mapPublicTipItem}
                imageSlotConfig={MYTIP_IMAGE_SLOTS}
                totalSlots={30}
                cols={5}
                emptyBg="#D9D9D9"
                onCardClick={openModal}
              />
            </div>
          </main>
        </div>
      </div>

      {/* 모달 */}
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
