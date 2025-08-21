"use client";

import { useEffect, useMemo, useState } from "react";
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

// 모달 컴포넌트 임포트
import FollowerListModal from "@/app/components/common/FollowerListModal";
import FollowingListModal from "@/app/components/common/FollowingListModal";

export default function UserFeedPage({
  params,
}: {
  params: { userNo: string };
}) {
  const id = Number(params.userNo);
  const invalidParam = !Number.isFinite(id);

  const router = useRouter();
  const searchParams = useSearchParams();
  const modalId = searchParams.get("modal");

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
        console.log(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
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

    // 상대 프로필 화면값 즉시 반영
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
    // 내 followingCount 전역 반영
    incFollowing(delta);

    try {
      if (currentIsFollow) await unfollowUser(String(id));
      else await followUser(String(id));

      // 내 카운트 최신 동기화
      const freshMe = await getUserProfile(myUserNo);
      setCountsFromProfile(freshMe);
    } catch (e) {
      // 실패 롤백
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
      console.log(e);
    } finally {
      setProcessing(false);
    }
  };

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
                    src={profile.profileImageUrl || "/img/1bee.png"}
                    alt="프로필 이미지"
                    fill
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

              {/* 가운데: 팔로워 수 ─ 클릭 시 모달 오픈 */}
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

              {/* 오른쪽: 팔로잉 수 ─ 클릭 시 모달 오픈 */}
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

              {/* 팔로우/언팔로우 토글 버튼 */}
              <button
                onClick={handleToggleFollow}
                disabled={processing}
                className={[
                  "w-24 h-12 rounded-xl border hover:cursor-pointer disabled:opacity-60",
                  profile.isFollowing
                    ? "bg-[var(--color-honey-pale)] border-[var(--color-honey-pale)]"
                    : "bg-white border-[var(--color-honey-pale)] hover:bg-[var(--color-honey-pale)]",
                ].join(" ")}
                aria-pressed={profile.isFollowing}
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

        {/* 특정 사용자 꿀팁을 헥사곤 그리드로 표시 */}
        <HexGridWithData<MyTipItem>
          fetcher={() => getUserTips(id)}
          mapItem={(t) => ({ id: t.no, label: t.title || "(제목 없음)" })}
          imageSlotConfig={MYTIP_IMAGE_SLOTS}
          totalSlots={30}
          cols={5}
          emptyBg="#D9D9D9"
          onCardClick={(tipId) => router.push(`?modal=${tipId}`)}
        />
      </div>

      {/* 꿀팁 상세 모달 (?modal=tipId) */}
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

      {/* 팔로워 / 팔로잉 모달 렌더링 */}
      {openFollowers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <FollowerListModal onClose={() => setOpenFollowers(false)} />
        </div>
      )}
      {openFollowings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <FollowingListModal onClose={() => setOpenFollowings(false)} />
        </div>
      )}
    </div>
  );
}
