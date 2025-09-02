"use client";

import HexCard from "./HexCard";
import HexImage from "./HexImage";

export type HexGridItem = {
  id: number | string;
  label?: string;
  // 디자인 전용 이미지(데이터 아님)
  image?: {
    src: string;
    width?: string;
    height?: string;
    top?: string;
    left?: string;
    rotate?: string;
    transform?: string;
  };
};

type Props = {
  items: HexGridItem[];
  colCount?: number; // 기본 5
};

export default function HexGridBase({ items, colCount = 5 }: Props) {
  const rowCount = Math.ceil(items.length / colCount);

  const columns = Array.from({ length: colCount }, (_, colIdx) =>
    Array.from({ length: rowCount }, (_, rowIdx) => {
      const index = rowIdx * colCount + colIdx;
      return items[index];
    }).filter(Boolean)
  );

  return (
    <div className="flex w-full justify-center px-4 pt-10">
      {columns.map((col, colIdx) => (
        <div
          key={colIdx}
          className={`flex flex-col items-center gap-3 xl:gap-4 2xl:gap-5 ${
            colIdx % 2 !== 1 ? "mt-[96px] xl:mt-[107px] 2xl:mt-[118px]" : ""
          }`}
          style={{ width: `${100 / colCount}%` }}
        >
          {col.map((item) => (
            <div key={item!.id} className="relative w-full min-w-0 hex-ar">
              {/* 디자인 레이어(뒤) */}
              {item!.image && (
                <HexImage
                  src={item!.image.src}
                  width={item!.image.width ?? "w-[120%]"}
                  height={item!.image.height ?? "h-[120%]"}
                  top={item!.image.top ?? "-top-6"}
                  left={item!.image.left ?? "left-[50%]"}
                  rotate={item!.image.rotate ?? ""}
                  transform={item!.image.transform ?? "translateX(-50%)"}
                />
              )}

              {/* 데이터 레이어(앞) - 이미지 있으면 투명 처리 */}
              <HexCard
                id={Number(item!.id)}
                label={item!.label ?? ""}
                transparent={!!item!.image}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
