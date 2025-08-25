"use client";

import { useEffect, useMemo, useState } from "react";
import HexCard from "./HexCard";
import HexImage from "./HexImage";
import HexagonWrapper from "./HexagonWrapper";

export type HexItem = { id: number | string; label: string };

export type ImageSlot = {
  src?: string;
  width: string;
  height: string;
  top: string;
  left?: string;
  rotate?: string;
  transform?: string;
  z?: number;
};

type DataSlot = { type: "data"; idx: number; item?: HexItem };
type ImgSlot = { type: "image"; idx: number; cfg: ImageSlot };
type Slot = DataSlot | ImgSlot;

type Props<TRaw> = {
  fetcher: () => Promise<TRaw[]>;
  mapItem: (raw: TRaw) => HexItem;
  imageSlotConfig: Record<number, ImageSlot>;
  totalSlots?: number;
  cols?: number;
  emptyBg?: string;
  onCardClick?: (id: number) => void;
  items?: TRaw[];
  externalLoading?: boolean;
};

export default function HexGridWithData<TRaw>({
  fetcher,
  mapItem,
  imageSlotConfig,
  totalSlots = 30,
  cols = 5,
  emptyBg = "#D9D9D9",
  onCardClick,
  items: itemsProp,
  externalLoading,
}: Props<TRaw>) {
  const [items, setItems] = useState<HexItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (itemsProp !== undefined) {
          // 외부 주입 데이터가 있으면 그것을 우선 사용
          const mapped = itemsProp.map(mapItem);
          if (alive) setItems(mapped);
        } else {
          // 없으면 기존처럼 내부에서 fetch
          const list = await fetcher();
          if (alive) setItems(list.map(mapItem));
        }
      } catch (e) {
        console.error("HexGridWithData fetch failed", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [itemsProp, fetcher, mapItem]);

  // 슬롯 생성: 이미지 슬롯은 고정, 나머지 슬롯에 items를 순차 배치
  const slots: Slot[] = useMemo(() => {
    const result: Slot[] = [];
    const imageIdx = new Set<number>(Object.keys(imageSlotConfig).map(Number));
    const dataQueue = [...items];

    for (let i = 1; i <= totalSlots; i++) {
      if (imageIdx.has(i)) {
        result.push({ type: "image", idx: i, cfg: imageSlotConfig[i] });
      } else {
        result.push({ type: "data", idx: i, item: dataQueue.shift() });
      }
    }
    return result;
  }, [items, imageSlotConfig, totalSlots]);

  // 열 단위 재배치 (벌집 오프셋)
  const columns: Slot[][] = useMemo(() => {
    const rows = Math.ceil(totalSlots / cols);
    return Array.from({ length: cols }, (_, colIdx) =>
      Array.from({ length: rows }, (_, rowIdx) => {
        const index = rowIdx * cols + colIdx;
        return slots[index];
      }).filter((s): s is Slot => s !== undefined && s !== null)
    );
  }, [slots, cols, totalSlots]);

  if (externalLoading ?? loading) {
    return <div className="text-center py-10">불러오는 중...</div>;
  }

  return (
    <div className="flex w-full justify-center px-4 pt-10">
      {columns.map((col, colIdx) => (
        <div
          key={colIdx}
          className={`flex flex-col items-center gap-3 ${
            colIdx % 2 !== 1 ? "mt-[107px]" : ""
          }`}
          style={{ width: `${100 / cols}%` }}
        >
          {col.map((slot) => {
            if (slot.type === "image") {
              const { cfg } = slot;
              const showImg = !!cfg?.src;
              return (
                <div
                  key={`img-${slot.idx}`}
                  className="relative w-full hex-ar overflow-visible pointer-events-none"
                >
                  {showImg ? (
                    <HexImage
                      src={cfg.src}
                      width={cfg.width}
                      height={cfg.height}
                      top={cfg.top}
                      left={cfg.left}
                      rotate={cfg.rotate}
                      transform={cfg.transform}
                      z={cfg.z ?? 5}
                    />
                  ) : (
                    <HexagonWrapper bg="transparent" />
                  )}
                </div>
              );
            }

            // data 슬롯
            const item = slot.item;
            if (item) {
              return (
                <div
                  key={`data-${slot.idx}`}
                  className="relative w-full hex-ar"
                >
                  <HexCard
                    id={Number(item.id)}
                    label={item.label || "(제목 없음)"}
                    onCardClick={(nid) => onCardClick?.(nid)}
                    userNo={1}
                  />
                </div>
              );
            }

            // 비어있는 데이터 칸
            return (
              <div key={`empty-${slot.idx}`} className="relative w-full hex-ar">
                <HexagonWrapper className="pointer-events-none" bg={emptyBg} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
