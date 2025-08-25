"use client";

import { useEffect, useRef } from "react";
import { useGroupStore } from "@/stores/useGroupStorageStore";

export function useEnsureGroupsLoaded() {
  const groupsLen = useGroupStore((s) => s.groups.length);
  const loading = useGroupStore((s) => s.loading);
  const load = useGroupStore((s) => s.load);

  // StrictMode 중복 호출/빠른 재렌더 대비
  const requestedRef = useRef(false);

  useEffect(() => {
    if (groupsLen > 0) return; // 이미 로드됨
    if (loading) return; // 로딩 중
    if (requestedRef.current) return; // 직전 프레임에서 이미 요청 시작함

    requestedRef.current = true;
    load().finally(() => {
      // 성공/실패와 무관하게 훅 차원에서는 한 번만 시도
      // (다시 시도하고 싶으면 상위에서 refresh 호출)
    });
  }, [groupsLen, loading, load]);
}
