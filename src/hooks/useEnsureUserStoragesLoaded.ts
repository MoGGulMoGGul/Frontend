"use client";

import { useEffect } from "react";
import { useUserStorageStore } from "@/stores/useUserStorageStore";

/**
 * 주어진 userNo의 개인 보관함 목록이 메모리(스토어)에 없으면 불러옵니다.
 * 이미 로드되어 있으면 아무것도 하지 않습니다.
 */
export function useEnsureUserStoragesLoaded(userNo: number | null) {
  const load = useUserStorageStore((s) => s.load);
  const ownerUserNo = useUserStorageStore((s) => s.ownerUserNo);
  const storages = useUserStorageStore((s) => s.storages);

  useEffect(() => {
    if (userNo == null) return;
    // 같은 유저의 데이터가 있고 목록도 있으면 스킵
    if (ownerUserNo === userNo && storages.length > 0) return;
    load(userNo).catch(() => {
      // 스토어가 에러 상태를 관리하므로 조용히 무시
    });
  }, [userNo, ownerUserNo, storages.length, load]);
}
