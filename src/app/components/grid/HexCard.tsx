"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useId, useMemo, useCallback } from "react";
import Image from "next/image";
import ContextMenu from "../shared/ContextMenu";
import HexagonWrapper from "./HexagonWrapper";
import Tooltip from "../common/Tooltip";
import { saveBookMarkTip } from "@/lib/tips";

import { useUserStorageStore } from "@/stores/useUserStorageStore";
import { useEnsureUserStoragesLoaded } from "@/hooks/useEnsureUserStoragesLoaded";

type ColorSet = { bg: string; border: string };

export default function HexCard({
  id,
  label,
  transparent = false,
  onCardClick,
  userNo = 1, //로그인 유저 번호 (개발용 기본 1)
}: {
  id: number;
  label: string;
  transparent?: boolean;
  onCardClick?: (id: number) => void;
  userNo?: number;
}) {
  const router = useRouter();
  const tooltipId = useId();
  const [savedInfo, setSavedInfo] = useState<{
    open: boolean;
    storageName: string;
  } | null>(null);

  //보관함 목록
  useEnsureUserStoragesLoaded(userNo);
  const storages = useUserStorageStore((s) => s.storages);
  const storagesLoading = useUserStorageStore((s) => s.loading);

  const [showMenu, setShowMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  const [colorSet, setColorSet] = useState<ColorSet>({
    bg: "rgba(249, 217, 118, 1)",
    border: "rgba(232, 155, 22, 1)",
  });

  useEffect(() => {
    const colorSets: ColorSet[] = [
      { bg: "rgba(249,217,118,0.9)", border: "rgba(232,155,22,1)" },
      { bg: "rgba(249,217,118,0.65)", border: "rgba(249,217,118,1)" },
      { bg: "rgba(255,243,176,0.7)", border: "rgba(255,239,150,1)" },
    ];
    setColorSet(colorSets[Math.floor(Math.random() * colorSets.length)]);
  }, []);

  const handleCardClick = () => {
    if (onCardClick) onCardClick(id);
    else router.push(`?modal=${id}`);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((v) => !v);
  };
  const handleLeave = () => setShowMenu(false);

  // 저장
  const saveToStorage = useCallback(
    async (storageNo: number, storageName: string) => {
      try {
        setSaving(true);
        await saveBookMarkTip({ tipNo: id, storageNo: storageNo });
        setShowMenu(false);
        setSavedInfo({ open: true, storageName });
      } catch {
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  // 메뉴 아이템 생성
  const menuItems = useMemo(() => {
    if (storagesLoading) {
      return [{ label: "보관함 불러오는 중...", onClick: () => {} }];
    }
    if (!storages || storages.length === 0) {
      return [{ label: "보관함이 없습니다", onClick: () => {} }];
    }
    return storages.map((st) => ({
      label: st.name,
      onClick: (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!saving) saveToStorage(st.storageNo, st.name);
      },
    }));
  }, [storages, storagesLoading, saving, saveToStorage]);

  return (
    <div
      role="button"
      className="w-full h-full flex flex-col items-center relative group/card hover:cursor-pointer"
      onClick={handleCardClick}
      onMouseLeave={handleLeave}
    >
      {/* 본 카드: 투명이면 내부 텍스트 렌더링 X */}
      <HexagonWrapper bg={transparent ? "transparent" : colorSet.bg}>
        {!transparent && (
          <span className="block mx-auto max-w-[90%] text-center truncate whitespace-nowrap">
            {label}
          </span>
        )}
      </HexagonWrapper>

      {/* 캡션: 항상 표시 */}
      <div className="w-full min-w-0 px-1">
        <div
          className="
        mt-1 mx-auto text-center
        text-[clamp(12px,0.9vw,14px)]
        max-w-[92%] xl:max-w-[86%] 2xl:max-w-[80%]
        h-[18px] leading-[18px]
        overflow-hidden text-ellipsis whitespace-nowrap
      "
        >
          {label}
        </div>
      </div>

      {/* hover 오버레이 (저장 버튼) */}
      <HexagonWrapper
        className="absolute inset-0 transition-all duration-500 ease-out scale-0 opacity-0 group-hover/card:scale-100 group-hover/card:opacity-100"
        bg="rgba(0,0,0,0.5)"
        rotate="0deg"
      >
        <div
          className="relative group cursor-pointer select-none"
          onClick={toggleMenu}
        >
          <Tooltip id={tooltipId} text={saving ? "저장 중..." : "저장하기"} />
          <Image
            src="/img/honeyjar.png"
            alt="저장하기"
            width={60}
            height={90}
            className={`object-cover ${saving ? "opacity-60" : ""}`}
            aria-describedby={tooltipId}
          />
        </div>
      </HexagonWrapper>

      {/* 컨텍스트 메뉴: 내 보관함 목록 */}
      {showMenu && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-4 z-20">
          <ContextMenu items={menuItems} onClose={() => setShowMenu(false)} />
        </div>
      )}
      {savedInfo?.open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={() => setSavedInfo(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-lg p-6 w-[320px] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-3">저장 완료</div>
            <div className="text-sm text-gray-700 mb-5">
              <span className="font-medium">‘{label}’</span>이(가)
              <br />
              <span className="font-medium">[{savedInfo.storageName}]</span>
              보관함에 저장되었어요.
            </div>
            <button
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 transition"
              onClick={() => setSavedInfo(null)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
