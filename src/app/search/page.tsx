"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/app/components/common/SearchBar";
import HexGridWithData, {
  type HexItem,
} from "@/app/components/grid/HexGridWithData";
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

  // --- 모달 파라미터: 숫자 변환 + 유효성 검사 (Home과 동일한 가드) ---
  const modalId = useMemo(() => {
    const raw = sp.get("modal");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [sp]);

  const [results, setResults] = useState<TipSearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const nfmt = useMemo(() => new Intl.NumberFormat(), []);

  // --- 검색결과를 HexItem으로 정규화: id는 tipId > no > id 우선순위 ---
  const mapSearchItemToHex = (t: TipSearchItem): HexItem => {
    const anyT = t as unknown as Record<string, unknown>;
    const id =
      (anyT["tipId"] as number | undefined) ??
      (anyT["no"] as number | undefined) ??
      (anyT["id"] as number | undefined);

    return {
      id: id as number, // 아래 가드들로 undefined 방지
      label: (anyT["title"] as string) || "(제목 없음)",
    };
  };

  // --- scope별 파라미터 없으면 즉시 no-op 검색으로 에러/불필요 호출 방지 ---
  const runSearch = useMemo(() => {
    // 검색 공통 콜백
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

    // 파라미터 누락 시 no-op
    const noop: (q: string) => void = () => {
      setResults([]);
      setLoading(false);
      setHasSearched(true);
    };

    switch (scope) {
      case "public":
      case "my":
        return createSearchHandler({ ...base, scope });
      case "group":
        if (!Number.isFinite(Number(groupId))) return noop;
        return createSearchHandler({
          ...base,
          scope: "group",
          groupId: groupId as number,
        });
      case "storage":
        if (!Number.isFinite(Number(storageId))) return noop;
        return createSearchHandler({
          ...base,
          scope: "storage",
          storageId: storageId as number,
        });
      case "user":
        if (!Number.isFinite(Number(userNo))) return noop;
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
          const nextQ = (next ?? "").trim();
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
              fetcher={async () => []} // 외부에서 items를 직접 주입
              mapItem={mapSearchItemToHex}
              imageSlotConfig={MYTIP_IMAGE_SLOTS}
              totalSlots={30}
              cols={5}
              emptyBg="#D9D9D9"
              items={results}
              externalLoading={loading}
              onCardClick={(id) => {
                const n = Number(id);
                if (!Number.isFinite(n)) return;
                const params = new URLSearchParams(sp.toString());
                params.set("modal", String(n));
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

      {/*  유효한 숫자일 때만 모달 렌더 */}
      {modalId !== null && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white p-6 rounded-lg">
            <ModalDetailContent id={modalId} onClose={() => router.back()} />
          </div>
        </div>
      )}
    </div>
  );
}
