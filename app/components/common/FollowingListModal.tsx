// app/components/common/FollowingListModal.tsx
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
} from "@/lib/user";
import { extractApiErrorMessage } from "@/lib/error";
import { useAuthStore } from "@/stores/useAuthStore";

export default function FollowingListModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [followings, setFollowings] = useState<FollowUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Set<number>>(new Set());
  const userNo = useAuthStore((s) => s.userNo);

  useEffect(() => {
    let alive = true;

    // 로그인 여부/값 가드
    if (typeof userNo !== "number") {
      setFollowings([]);
      setErrMsg("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const data = await getFollowings(userNo);
        if (!alive) return;
        setFollowings(data);
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
  }, [userNo]);

  const setBusy = (userNo: number, on: boolean) =>
    setProcessing((prev) => {
      const next = new Set(prev);
      if (on) {
        next.add(userNo);
      } else {
        next.delete(userNo);
      }
      return next;
    });

  const handleToggleFollow = async (
    userNo: number,
    currentIsFollow: boolean
  ) => {
    if (processing.has(userNo)) return; // 중복 클릭 방지
    setErrMsg(null);
    setBusy(userNo, true);

    // 낙관적 업데이트
    setFollowings((prev) =>
      prev.map((u) =>
        u.userNo === userNo ? { ...u, isFollow: !currentIsFollow } : u
      )
    );

    try {
      if (currentIsFollow) {
        await unfollowUser(String(userNo));
      } else {
        await followUser(String(userNo));
      }
    } catch (err) {
      // 실패 시 롤백
      setFollowings((prev) =>
        prev.map((u) =>
          u.userNo === userNo ? { ...u, isFollow: currentIsFollow } : u
        )
      );
      setErrMsg(extractApiErrorMessage(err));
    } finally {
      setBusy(userNo, false);
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
              const isBusy = processing.has(f.userNo);
              return (
                <li
                  key={f.userNo}
                  className="flex items-center justify-between mb-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-[40px] h-[40px] rounded-full overflow-hidden bg-[#d9d9d9]">
                      <Image
                        src={f.profileImageUrl || "/img/1bee.png"}
                        alt={`${f.nickname} 프로필 이미지`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xl">{f.nickname}</span>
                  </div>

                  <button
                    onClick={() => handleToggleFollow(f.userNo, f.isFollow)}
                    disabled={isBusy}
                    className={[
                      "w-[94px] h-[49px] rounded-xl border hover:cursor-pointer disabled:opacity-60",
                      f.isFollow
                        ? "bg-[var(--color-honey-pale)] border-[var(--color-honey-pale)]"
                        : "bg-white border-[var(--color-honey-pale)] hover:bg-[var(--color-honey-pale)]",
                    ].join(" ")}
                    aria-pressed={f.isFollow}
                    aria-label={f.isFollow ? "언팔로우" : "팔로우"}
                    title={f.isFollow ? "언팔로우" : "팔로우"}
                  >
                    {isBusy ? "처리 중..." : f.isFollow ? "팔로잉" : "팔로우"}
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
