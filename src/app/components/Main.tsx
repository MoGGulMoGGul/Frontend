"use client";

import { useRouter } from "next/navigation";
import HexGridWithData, { type HexItem } from "./grid/HexGridWithData";
import { getPublicTips, type PublicTipItem } from "@/lib/tips";
import { MYTIP_IMAGE_SLOTS } from "@/app/components/grid/TipImageSlots";

// 공개 피드용 매핑
const mapPublicTipItem = (t: PublicTipItem): HexItem => ({
  id: t.no,
  label: t.title || "(제목 없음)",
});

export default function Main() {
  const router = useRouter();
  const openModal = (id: number) => router.push(`?modal=${id}`);

  return (
    <div className="relative">
      <main className="relative overflow-x-clip">
        {/* 항상 전체 공개 꿀팁 피드만 표시 */}
        <HexGridWithData<PublicTipItem>
          fetcher={getPublicTips}
          mapItem={mapPublicTipItem}
          imageSlotConfig={MYTIP_IMAGE_SLOTS}
          totalSlots={30}
          cols={5}
          emptyBg="#D9D9D9"
          onCardClick={openModal}
        />
      </main>
    </div>
  );
}
