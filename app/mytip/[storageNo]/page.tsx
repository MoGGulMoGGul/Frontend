"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import SearchBar from "@/app/components/common/SearchBar";
import HexGridWithData, {
  type HexItem,
} from "@/app/components/grid/HexGridWithData";
import { MYTIP_IMAGE_SLOTS } from "@/app/components/grid/TipImageSlots";
import ModalDetailContent from "@/app/components/modal/ModalDetailContent";
import { getStorageTips } from "@/lib/storage";

export default function MyDetailTipPage() {
  const router = useRouter();
  const { storageNo: storageNoStr } = useParams<{ storageNo: string }>();
  const storageNo = Number(storageNoStr);

  const searchParams = useSearchParams();
  const modalId = searchParams.get("modal");

  if (!Number.isFinite(storageNo)) {
    return <main className="p-6">잘못된 경로입니다.</main>;
  }

  // HexGrid가 요구하는 간단 매퍼 (기본 피드 전용)
  const mapItem = (t: { id: number; title?: string }): HexItem => ({
    id: t.id,
    label: t.title || "(제목 없음)",
  });

  return (
    <>
      {/* 검색: 입력 시 /search로 이동 (이 페이지에선 통신 X) */}
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
          onCardClick={(id) => router.push(`?modal=${id}`)}
        />

        {/* 쿼리 기반 모달 */}
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
      </div>
    </>
  );
}
