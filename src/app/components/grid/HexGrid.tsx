"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import HexCard from "./HexCard";
import HexImage from "./HexImage";
import HexagonWrapper from "./HexagonWrapper";
import { getMyTips, type MyTipItem } from "@/lib/tips";

import { MYTIP_IMAGE_SLOTS } from "@/app/components/grid/TipImageSlots";

type ImageSlot = {
  src?: string;
  width: string;
  height: string;
  top: string;
  left?: string;
  rotate?: string;
  transform?: string;
  z?: number;
};

const TOTAL_SLOTS = 30;
const COLS = 5;
const EMPTY_BG = "#D9D9D9"; // 데이터 없는 칸(회색)

export default function HexGrid() {
  const [tips, setTips] = useState<MyTipItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTips = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getMyTips();
      setTips(list);
    } catch (e) {
      console.error("내 꿀팁 조회 실패", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTips();
  }, [loadTips]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getMyTips();
        setTips(list);
      } catch (e) {
        console.error("내 꿀팁 조회 실패", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 30칸: 이미지 슬롯은 고정 예약, 나머지 칸에 팁을 순차 배치
  const slots = useMemo(() => {
    const result: Array<
      | { type: "image"; idx: number; cfg: ImageSlot }
      | { type: "data"; idx: number; tip?: MyTipItem }
    > = [];
    const imageIdx = new Set(Object.keys(MYTIP_IMAGE_SLOTS).map(Number));
    const dataTips = [...tips];

    for (let i = 1; i <= TOTAL_SLOTS; i++) {
      if (imageIdx.has(i)) {
        result.push({ type: "image", idx: i, cfg: MYTIP_IMAGE_SLOTS[i] });
      } else {
        result.push({ type: "data", idx: i, tip: dataTips.shift() });
      }
    }
    return result;
  }, [tips]);

  // 열 단위 재배치
  const columns = useMemo(() => {
    const rows = Math.ceil(TOTAL_SLOTS / COLS);
    return Array.from({ length: COLS }, (_, colIdx) =>
      Array.from({ length: rows }, (_, rowIdx) => {
        const index = rowIdx * COLS + colIdx;
        return slots[index];
      }).filter(Boolean)
    );
  }, [slots]);

  if (loading) return <div className="text-center py-10">불러오는 중...</div>;

  return (
    <div className="flex w-full justify-center px-4 pt-10">
      {columns.map((col, colIdx) => (
        <div
          key={colIdx}
          className={`flex flex-col items-center gap-3 xl:gap-4 2xl:gap-5 ${
            colIdx % 2 !== 1 ? "mt-[96px] xl:mt-[107px] 2xl:mt-[118px]" : ""
          }`}
          style={{ width: `${100 / COLS}%` }}
        >
          {col.map((slot) => {
            if (!slot) return null;

            if (slot.type === "image") {
              const { cfg } = slot;
              const showImg = !!(cfg.src && cfg.src.trim()); // 빈 문자열 방지
              return (
                <div
                  key={`img-${slot.idx}`}
                  className="relative w-full min-w-0 hex-ar pointer-events-none"
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
                    // 아무것도 안 보이게 하려면 배경도 투명
                    <HexagonWrapper bg="transparent" />
                  )}
                </div>
              );
            }

            const tip = slot.tip;
            if (tip) {
              // 데이터 있음: 색 있는 카드(클릭/호버 가능)
              return (
                <div
                  key={`tip-${slot.idx}`}
                  className="relative w-full min-w-0 hex-ar"
                >
                  <HexCard
                    id={tip.no}
                    label={tip.title || "(제목 없음)"}
                    transparent={false}
                  />
                </div>
              );
            }

            // 데이터 없음: 회색(비활성)
            return (
              <div
                key={`empty-${slot.idx}`}
                className="relative w-full min-w-0 hex-ar"
              >
                <HexagonWrapper className="pointer-events-none" bg={EMPTY_BG} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
