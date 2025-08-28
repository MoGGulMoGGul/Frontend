"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/app/components/common/SearchBar";
import ModalDetailContent from "@/app/components/modal/ModalDetailContent";
import HexGridWithData from "@/app/components/grid/HexGridWithData";
import { MYTIP_IMAGE_SLOTS } from "@/app/components/grid/TipImageSlots";

import {
  getUserProfile,
  type UserProfile as ApiUserProfile,
  followUser,
  unfollowUser,
} from "@/lib/user";
import { getUserTips, type MyTipItem } from "@/lib/tips";
import { useAuthStore } from "@/stores/useAuthStore";
import FollowerListModal from "@/app/components/common/FollowerListModal";
import FollowingListModal from "@/app/components/common/FollowingListModal";
import { resolveLocalThumb } from "@/lib/resolveLocalThumb";

export default function UserFeedPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const id = Number(sp.get("userNo") ?? NaN);
  const invalidParam = !Number.isFinite(id);

  const myUserNo = useAuthStore((s) => s.userNo);
  const incFollowing = useAuthStore((s) => s.incFollowing);
  const setCountsFromProfile = useAuthStore((s) => s.setCountsFromProfile);

  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  const [processing, setProcessing] = useState<boolean>(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  // 팔로워/팔로잉 모달 열기 상태
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowings, setOpenFollowings] = useState(false);

  const nfmt = useMemo(() => new Intl.NumberFormat(), []);

  useEffect(() => {
    if (invalidParam) {
      setLoading(false);
      setErr("잘못된 사용자 번호입니다.");
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getUserProfile(id);
        if (!alive) return;
        setProfile(data);
      } catch (e) {
        if (!alive) return;
        setErr("프로필 정보를 불러오지 못했습니다.");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // sp는 객체 동일성이 바뀔 수 있으므로 id만 의존
  }, [id, invalidParam]);

  const handleToggleFollow = async () => {
    if (!profile || processing) return;
    if (typeof myUserNo !== "number") {
      setActionErr("로그인이 필요합니다.");
      return;
    }

    setProcessing(true);
    setActionErr(null);

    const currentIsFollow = !!profile.isFollowing;
    const delta = currentIsFollow ? -1 : 1;

    // UI 낙관적 업데이트
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: !currentIsFollow,
            followerCount: Math.max(
              0,
              (prev.followerCount ?? 0) + (currentIsFollow ? -1 : 1)
            ),
          }
        : prev
    );
    incFollowing(delta);

    try {
      if (currentIsFollow) {
        await unfollowUser(profile.loginId);
      } else {
        await followUser(profile.loginId);
      }
      const freshMe = await getUserProfile(myUserNo);
      setCountsFromProfile(freshMe);
    } catch (e) {
      // 롤백
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: currentIsFollow,
              followerCount: Math.max(
                0,
                (prev.followerCount ?? 0) + (currentIsFollow ? 1 : -1)
              ),
            }
          : prev
      );
      incFollowing(-delta);
      setActionErr("요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  if (invalidParam) {
    return <main className="p-6">잘못된 경로입니다.</main>;
  }

  return (
    <div>
      <SearchBar />

      <div className="p-6 pt-0">
        {/* 유저 인포 영역 */}
        <div className="w-full bg-[rgba(249,217,118,0.52)] rounded-4xl py-5 px-8 mb-16">
          {loading ? (
            <div className="py-10 text-center text-[#979696]">
              프로필 불러오는 중…
            </div>
          ) : err ? (
            <div className="py-10 text-center text-red-500">{err}</div>
          ) : profile ? (
            <div className="flex items-center h-full justify-between">
              {/* 좌측: 프로필 이미지 + 닉네임/로그인ID */}
              <div className="flex items-center">
                <div className="relative w-24 h-24 rounded-full bg-gray-300 mr-2 overflow-hidden">
                  <Image
                    src={resolveLocalThumb(
                      profile?.profileImageUrl,
                      "/img/1bee.png"
                    )}
                    alt="프로필 이미지"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-xl">
                    {profile.nickname || "(닉네임 없음)"}
                  </div>
                  <div className="text-[#979696]">{profile.loginId || ""}</div>
                </div>
              </div>

              {/* 가운데: 팔로워 수 (모달) */}
              <button
                type="button"
                onClick={() => setOpenFollowers(true)}
                className="relative flex flex-col text-center group focus:outline-none cursor-pointer"
                aria-haspopup="dialog"
                aria-expanded={openFollowers}
                title="팔로워 목록 보기"
              >
                <div className="w-10 aspect-[2/3] absolute -top-6 left-[50px] opacity-80 group-hover:opacity-100 transition-opacity">
                  <Image
                    src="/img/1bee.png"
                    alt="꿀벌"
                    width={40}
                    height={60}
                    className="object-contain"
                  />
                </div>
                <div className="text-[10px] font-semibold relative z-10">
                  팔로워 수
                </div>
                <div className="text-2xl font-extrabold relative z-10">
                  {nfmt.format(profile.followerCount ?? 0)}
                </div>
              </button>

              {/* 오른쪽: 팔로잉 수 (모달) */}
              <button
                type="button"
                onClick={() => setOpenFollowings(true)}
                className="relative flex flex-col text-center group focus:outline-none cursor-pointer"
                aria-haspopup="dialog"
                aria-expanded={openFollowings}
                title="팔로잉 목록 보기"
              >
                <div className="w-10 aspect-[2/3] absolute -top-6 left-[50px] opacity-80 group-hover:opacity-100 transition-opacity">
                  <Image
                    src="/img/1bee.png"
                    alt="꿀벌"
                    width={40}
                    height={60}
                    className="object-contain"
                  />
                </div>
                <div className="text-[10px] font-semibold relative z-10">
                  팔로잉 수
                </div>
                <div className="text-2xl font-extrabold relative z-10">
                  {nfmt.format(profile.followingCount ?? 0)}
                </div>
              </button>

              {/* 팔로우/언팔 토글 */}
              <button
                onClick={handleToggleFollow}
                disabled={processing}
                className={[
                  "w-24 h-12 rounded-xl border hover:cursor-pointer disabled:opacity-60",
                  profile.isFollowing
                    ? "bg-[var(--color-honey-pale)] border-[var(--color-honey-pale)]"
                    : "bg-white border-[var(--color-honey-pale)] hover:bg-[var(--color-honey-pale)]",
                ].join(" ")}
                aria-pressed={profile.isFollowing ?? undefined}
                aria-label={profile.isFollowing ? "언팔로우" : "팔로우"}
                title={profile.isFollowing ? "언팔로우" : "팔로우"}
              >
                {processing
                  ? "처리 중..."
                  : profile.isFollowing
                  ? "팔로잉"
                  : "팔로우"}
              </button>
            </div>
          ) : (
            <div className="py-10 text-center text-[#979696]">
              사용자 정보가 없습니다.
            </div>
          )}

          {actionErr && (
            <div className="pt-3 text-center text-sm text-red-600">
              {actionErr}
            </div>
          )}
        </div>

        {/* 특정 사용자 꿀팁 그리드 */}
        <HexGridWithData<MyTipItem>
          fetcher={() => getUserTips(id)}
          mapItem={(t) => ({ id: t.no, label: t.title || "(제목 없음)" })}
          imageSlotConfig={MYTIP_IMAGE_SLOTS}
          totalSlots={30}
          cols={5}
          emptyBg="#D9D9D9"
          onCardClick={(tipId) => {
            const next = new URLSearchParams(sp.toString());
            next.set("modal", String(tipId));
            router.push(`?${next.toString()}`);
          }}
        />
      </div>

      {/* 얇은 모달 레이어 */}
      <Suspense fallback={null}>
        <ModalLayer />
      </Suspense>

      {/* 팔로워 / 팔로잉 모달 */}
      {openFollowers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <FollowerListModal
            targetUserNo={id}
            onClose={() => setOpenFollowers(false)}
          />
        </div>
      )}
      {openFollowings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <FollowingListModal
            targetUserNo={id}
            onClose={() => setOpenFollowings(false)}
          />
        </div>
      )}
    </div>
  );
}

function ModalLayer() {
  const router = useRouter();
  const sp = useSearchParams();
  const modalId = sp.get("modal");
  if (!modalId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <ModalDetailContent
          id={parseInt(modalId)}
          onClose={() => router.back()}
        />
      </div>
    </div>
  );
}
