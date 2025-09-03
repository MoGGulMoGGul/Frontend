"use client";

import Image from "next/image";
import HexGrid from "../components/grid/HexGrid";
import { useSearchParams, useRouter } from "next/navigation";
import ModalDetailContent from "../components/modal/ModalDetailContent";
import { useEffect, useState } from "react";
import {
  getWeeklyBookmarkRanking,
  type WeeklyBookmarkRankingItem,
} from "@/lib/tips";
import SearchBar from "../components/common/SearchBar";
import { resolveLocalThumb } from "@/lib/resolveLocalThumb";

export default function ChallengePage() {
  const searchParams = useSearchParams();
  const modalId = searchParams.get("modal");
  const router = useRouter();

  const [ranking, setRanking] = useState<WeeklyBookmarkRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getWeeklyBookmarkRanking();
        setRanking(data.slice(0, 3));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "랭킹 조회 실패";
        setErr(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="w-full max-w-screen-xl mx-auto px-6">
      {/*  공개 꿀팁 검색으로 이동 */}
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
        <div className="flex items-start gap-10 mb-3">
          <div className="flex-shrink-0 w-[320px] text-center pt-6">
            <h2 className="text-3xl font-extrabold mb-3 leading-snug">
              이번주 꿀벌들이 선택한 <br /> BEST 꿀팁🍯
            </h2>
            <div className="text-sm">
              어떤 꿀팁이 제일 &ldquo;저장&rdquo;이 많이 되었는지를
              확인해보세요!
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide w-0 flex-1">
            <div className="flex gap-8 w-max px-2 pt-6 hover:cursor-pointer pl-[23px]">
              {loading && (
                <div className="text-sm text-gray-500">불러오는 중...</div>
              )}
              {err && <div className="text-sm text-red-500">{err}</div>}
              {!loading &&
                !err &&
                ranking.map((item, idx) => {
                  return (
                    <div
                      key={`rank-${item.tipNo}-${idx}`} // tipId 중복/undefined 대비
                      onClick={() => router.push(`?modal=${item.tipNo}`)}
                      className="shrink-0 border border-[#d9d9d9] rounded-xl flex relative w-[350px] h-[150px] p-4 pt-[24px] pl-[10px]"
                    >
                      <span className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[46px] h-[46px] border border-[#d9d9d9] rounded-full bg-white flex items-center justify-center text-sm font-bold">
                        {idx + 1}위
                      </span>
                      <div className="relative w-[100px] h-[100px] overflow-hidden mr-2.5 rounded">
                        <Image
                          src={resolveLocalThumb(
                            item.thumbnailUrl,
                            "/img/1bee.png"
                          )}
                          alt={item.title}
                          sizes="100px"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[20px] max-w-[200px] font-bold mb-3 overflow-hidden whitespace-nowrap text-ellipsis">
                          {item.title}
                        </div>
                        <div className="max-w-[200px] overflow-hidden whitespace-nowrap text-ellipsis text-xs mb-4">
                          <div className="inline-flex gap-1">
                            {item.tags.slice(0, 4).map((tag, tIdx) => (
                              <span
                                key={`tag-${item.tipNo}-${tIdx}`}
                                className="bg-[#d9d9d9]/50 border border-black/10 px-2 py-0.5 rounded-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative  w-[20px] h-[20px] rounded-full overflow-hidden bg-[#d9d9d9]">
                            <Image
                              src={resolveLocalThumb(
                                item.thumbnailUrl,
                                "/img/1bee.png"
                              )}
                              alt={item.title}
                              sizes="20"
                              fill
                            />
                          </div>
                          <span className="font-bold text-sm">
                            {item.nickname}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <HexGrid />
      </div>

      {modalId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <ModalDetailContent
              id={Number(modalId)}
              onClose={() => router.back()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
