"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import CommonModal from "../modal/CommonModal";
import ModalCancelBtn from "../modal/ModalCancelBtn";
import {
  getFollowings,
  followUser,
  unfollowUser,
  type FollowUserItem,
  getUserProfile,
} from "@/lib/user";
import { extractApiErrorMessage } from "@/lib/error";
import { useAuthStore } from "@/stores/useAuthStore";
import { resolveLocalThumb } from "@/lib/resolveLocalThumb";

export default function FollowingListModal({
  targetUserNo,
  onClose,
}: {
  targetUserNo: number;
  onClose: () => void;
}) {
  const [followings, setFollowings] = useState<FollowUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // 진행 상태는 loginId 기준으로 관리
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  // 로그인한 내 번호 (카운트 동기화용)
  const myUserNo = useAuthStore((s) => s.userNo);
  const incFollowing = useAuthStore((s) => s.incFollowing);
  const setCountsFromProfile = useAuthStore((s) => s.setCountsFromProfile);

  useEffect(() => {
    let alive = true;

    // 로그인 여부/값 가드
    if (typeof myUserNo !== "number") {
      setFollowings([]);
      setErrMsg("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        // 전달받은 targetUserNo의 팔로잉 목록 조회
        const data = await getFollowings(targetUserNo);
        if (!alive) return;
        setFollowings(
          data.map((u) => ({ ...u, isFollowing: !!u.isFollowing }))
        ); // [MOD] 초기 정규화(안전)
        setErrMsg(null);
      } catch (err: unknown) {
        if (alive) setErrMsg(extractApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [targetUserNo, myUserNo]);

  const setBusy = (loginId: string, on: boolean) =>
    setProcessing((prev) => {
      const next = new Set(prev);
      if (on) next.add(loginId);
      else next.delete(loginId);
      return next;
    });

  // loginId로 API 호출, userNo는 UI 토글 기준
  const handleToggleFollow = async (
    targetLoginId: string,
    targetUserNoForUi: number,
    currentIsFollow: boolean
  ) => {
    setErrMsg(null);
    if (processing.has(targetLoginId)) return;
    if (typeof myUserNo !== "number") {
      setErrMsg("로그인이 필요합니다.");
      return;
    }

    setBusy(targetLoginId, true);

    // 1) UI 즉시 토글
    setFollowings((prev) =>
      prev.map((u) =>
        u.userNo === targetUserNoForUi
          ? { ...u, isFollowing: !currentIsFollow }
          : u
      )
    );

    // 2) 내 followingCount 낙관적 반영
    const delta = currentIsFollow ? -1 : 1;
    incFollowing(delta);

    try {
      // 3) API (백엔드가 loginId를 기대)
      if (currentIsFollow) {
        await unfollowUser(targetLoginId);
      } else {
        await followUser(targetLoginId);
      }

      // 4) 내 카운트 최신 동기화
      const freshMe = await getUserProfile(myUserNo);
      setCountsFromProfile(freshMe);
    } catch (err) {
      // 5) 실패 시 UI/카운트 롤백
      setFollowings((prev) =>
        prev.map((u) =>
          u.userNo === targetUserNoForUi
            ? { ...u, isFollowing: currentIsFollow }
            : u
        )
      );
      incFollowing(-delta);
      setErrMsg(extractApiErrorMessage(err));
    } finally {
      setBusy(targetLoginId, false);
    }
  };

  return (
    <CommonModal>
      <div className="w-[680px]">
        <div className="font-bold text-2xl mb-4 text-center">팔로잉 목록</div>

        {loading && (
          <div className="py-8 text-center text-gray-500">불러오는 중...</div>
        )}

        {!loading && errMsg && (
          <div className="py-6 text-center text-red-600">{errMsg}</div>
        )}

        {!loading && !errMsg && followings.length === 0 && (
          <div className="py-6 text-center text-gray-500">
            아직 팔로잉이 없어요.
          </div>
        )}

        {!loading && !errMsg && followings.length > 0 && (
          <ul>
            {followings.map((f) => {
              const busyKey = f.loginId ?? String(f.userNo);
              const isBusy = processing.has(busyKey);
              const canFollow = !!(f.loginId && f.loginId.trim().length > 0);

              return (
                <li
                  key={f.userNo}
                  className="flex items-center justify-between mb-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-[40px] h-[40px] rounded-full overflow-hidden bg-[#d9d9d9]">
                      <Image
                        src={resolveLocalThumb(
                          f.profileImageUrl,
                          "/img/1bee.png"
                        )}
                        alt={`${f.nickname} 프로필 이미지`}
                        sizes="40px"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                    <span className="text-xl">{f.nickname}</span>
                  </div>

                  <button
                    onClick={() =>
                      canFollow &&
                      handleToggleFollow(f.loginId!, f.userNo, f.isFollowing)
                    }
                    disabled={isBusy || !canFollow}
                    className={[
                      "w-[94px] h-[49px] rounded-xl border hover:cursor-pointer disabled:opacity-60",
                      f.isFollowing
                        ? "bg-[var(--color-honey-pale)] border-[var(--color-honey-pale)]"
                        : "bg-white border-[var(--color-honey-pale)] hover:bg-[var(--color-honey-pale)]",
                    ].join(" ")}
                    aria-pressed={!!f.isFollowing}
                    aria-label={f.isFollowing ? "언팔로우" : "팔로우"}
                    title={
                      canFollow
                        ? f.isFollowing
                          ? "언팔로우"
                          : "팔로우"
                        : "아이디 정보가 없어 팔로우할 수 없어요"
                    }
                  >
                    {isBusy
                      ? "처리 중..."
                      : f.isFollowing
                      ? "팔로잉"
                      : "팔로우"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-center">
        <ModalCancelBtn label="닫기" onClose={onClose} />
      </div>
    </CommonModal>
  );
}
