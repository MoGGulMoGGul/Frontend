"use client";

import { useEffect, useMemo, useState } from "react";
import HexGridBase, { HexGridItem } from "./HexGridBase";
import { getMyTips, MyTipItem } from "@/lib/tips";
import { resolveLocalThumb } from "@/lib/resolveLocalThumb";

const FALLBACK_IMG = "/img/1bee.png"; // 썸네일 없을 때 사용(선택)

export default function MyTipsHexGrid() {
  const [tips, setTips] = useState<MyTipItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const items: HexGridItem[] = useMemo(
    () =>
      tips.map((t) => {
        const thumbSrc = t.thumbnailUrl
          ? resolveLocalThumb(t.thumbnailUrl, FALLBACK_IMG)
          : undefined;

        return {
          id: t.no,
          label: t.title || "(제목 없음)",
          image: thumbSrc
            ? {
                src: thumbSrc,
                width: "w-[120%]",
                height: "h-[120%]",
                top: "-top-6",
                left: "left-[50%]",
                transform: "translateX(-50%)",
              }
            : undefined,
        } as HexGridItem;
      }),
    [tips]
  );

  if (loading) return <div className="text-center py-10">불러오는 중...</div>;
  if (items.length === 0)
    return <div className="text-center py-10">내 꿀팁이 없습니다.</div>;

  return <HexGridBase items={items} colCount={5} />;
}
