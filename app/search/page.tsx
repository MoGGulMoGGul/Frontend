"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/app/components/common/SearchBar";
import HexGridWithData from "@/app/components/grid/HexGridWithData";
import ModalDetailContent from "@/app/components/modal/ModalDetailContent";
import { MYTIP_IMAGE_SLOTS } from "@/app/components/grid/TipImageSlots";

import { createSearchHandler, type TipSearchItem } from "@/lib/search";

export default function SearchPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const q = (sp.get("q") || "").trim();

  // public | my | group | storage | user
  const scope = (sp.get("scope") || "public") as
    | "public"
    | "my"
    | "group"
    | "storage"
    | "user";

  const groupId = sp.get("groupId") ? Number(sp.get("groupId")) : undefined;
  const storageId = sp.get("storageId")
    ? Number(sp.get("storageId"))
    : undefined;
  const userNo = sp.get("userNo") ? Number(sp.get("userNo")) : undefined;

  const modalId = sp.get("modal");

  const [results, setResults] = useState<TipSearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const nfmt = useMemo(() => new Intl.NumberFormat(), []);

  const runSearch = useMemo(() => {
    // scope 별로 필요한 파라미터를 정확히 넘김
    const base = {
      mode: "OR" as const,
      page: 0,
      size: 30,
      onResult: (rows: TipSearchItem[]) => {
        setResults(rows);
        setLoading(false);
        setHasSearched(true);
      },
      onError: () => {
        setResults([]);
        setLoading(false);
        setHasSearched(true);
      },
    };

    switch (scope) {
      case "public":
      case "my":
        return createSearchHandler({ ...base, scope });
      case "group":
        return createSearchHandler({
          ...base,
          scope: "group",
          groupId: groupId as number,
        });
      case "storage":
        return createSearchHandler({
          ...base,
          scope: "storage",
          storageId: storageId as number,
        });
      case "user":
        return createSearchHandler({
          ...base,
          scope: "user",
          userNo: userNo as number,
        });
    }
  }, [scope, groupId, storageId, userNo]);

  useEffect(() => {
    if (!q) {
      setResults(null);
      setLoading(false);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(false);
    runSearch(q);
  }, [q, runSearch]);

  const placeholder =
    scope === "my"
      ? "내 꿀팁 검색"
      : scope === "group"
      ? "그룹 꿀팁 검색"
      : scope === "storage"
      ? "보관함 꿀팁 검색"
      : scope === "user"
      ? "이 사용자 꿀팁 검색"
      : "전체 꿀팁 검색";

  return (
    <div className="px-4">
      <SearchBar
        placeholder={placeholder}
        defaultValue={q}
        onSearch={(next) => {
          const nextQ = next.trim();
          if (!nextQ) return;
          const params = new URLSearchParams(sp.toString());
          params.set("q", nextQ);
          router.push(`/search?${params.toString()}`);
        }}
      />

      <div className="relative p-6 pt-0">
        {!q ? (
          <div className="text-center text-[#979696] py-12">
            검색어를 입력해 주세요.
          </div>
        ) : loading ? (
          <div className="text-center text-[#979696] py-12">검색 중…</div>
        ) : hasSearched && results && results.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-[#666]">
              총 {nfmt.format(results.length)}건
            </div>
            <HexGridWithData<TipSearchItem>
              fetcher={async () => []}
              mapItem={(t) => ({ id: t.id, label: t.title || "(제목 없음)" })}
              imageSlotConfig={MYTIP_IMAGE_SLOTS}
              totalSlots={30}
              cols={5}
              emptyBg="#D9D9D9"
              items={results}
              externalLoading={loading}
              onCardClick={(id) => {
                const params = new URLSearchParams(sp.toString());
                params.set("modal", String(id));
                router.push(`/search?${params.toString()}`);
              }}
            />
          </>
        ) : hasSearched ? (
          <div className="text-center text-[#979696] py-12">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="text-center text-[#979696] py-12">검색 중…</div>
        )}
      </div>

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
  );
}
