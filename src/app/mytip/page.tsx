"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

import ModalDetailContent from "../components/modal/ModalDetailContent";
import HexGridWithData from "../components/grid/HexGridWithData";
import FloatingBtn from "../components/FloatingBtn";
import SearchBar from "../components/common/SearchBar";

import { getMyTips, getUserTips, type MyTipItem } from "@/lib/tips";
import { MYTIP_IMAGE_SLOTS } from "@/app/components/grid/TipImageSlots";

import FollowerListModal from "../components/common/FollowerListModal";
import FollowingListModal from "../components/common/FollowingListModal";

// 로컬스토리지(퍼시스트)에서 유저/프로필을 읽어오기
import { useAuthStore } from "@/stores/useAuthStore";
import { resolveLocalThumb } from "@/lib/resolveLocalThumb";

export default function MytipPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modalId = searchParams.get("modal");

  const userNo = useAuthStore((s) => s.userNo);

  // 팔로워/팔로잉 모달 상태
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowings, setOpenFollowings] = useState(false);

  const profileImageUrl = useAuthStore((s) => s.profileImageUrl);
  const nickname = useAuthStore((s) => s.nickname);
  const login = useAuthStore((s) => s.login);
  const followerCount = useAuthStore((s) => s.followerCount);
  const followingCount = useAuthStore((s) => s.followingCount);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const nfmt = new Intl.NumberFormat();

  const tipsFetcher =
    typeof userNo === "number" ? () => getUserTips(userNo) : getMyTips;

  return (
    <>
      <SearchBar
        placeholder="내 꿀팁 검색"
        onSearch={(q) => {
          const keyword = q.trim();
          if (!keyword) return;
          const params = new URLSearchParams({ scope: "my", q: keyword });
          router.push(`/search?${params.toString()}`);
        }}
      />

      <div className="relative p-6 pt-0">
        {/* 유저 인포 영역 */}
        <div className="w-full bg-[rgba(249,217,118,0.52)] rounded-4xl py-5 px-8 mb-16">
          <div className="flex items-center h-full justify-between">
            {/* 좌측: 프로필 이미지 + 닉네임/로그인ID */}
            <div className="flex items-center">
              <div className="relative w-24 h-24 rounded-full bg-gray-300 mr-2 overflow-hidden">
                <Image
                  src={resolveLocalThumb(profileImageUrl, "/img/1bee.png")}
                  alt="프로필 이미지"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <div className="font-semibold text-xl">
                  {nickname || "(닉네임 없음)"}
                </div>
                <div className="text-[#979696]">{login || ""}</div>
              </div>
            </div>

            {/* 가운데: 팔로워 수 (클릭 시 모달) */}
            <button
              type="button"
              onClick={() => setOpenFollowers(true)}
              className="relative flex flex-col text-center group focus:outline-none"
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
                {nfmt.format(followerCount ?? 0)}
              </div>
            </button>

            {/* 오른쪽: 팔로잉 수 (클릭 시 모달) */}
            <button
              type="button"
              onClick={() => setOpenFollowings(true)}
              className="relative flex flex-col text-center group focus:outline-none"
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
                {nfmt.format(followingCount ?? 0)}
              </div>
            </button>

            {/* 팔로우 버튼(상대 프로필 상세에서 쓰는 영역이라면 조건부로 바꾸면 됨) */}
            <button className="w-24 h-12 rounded-xl border border-[var(--color-honey-pale)] bg-white hover:bg-[var(--color-honey-pale)] hover:cursor-pointer">
              팔로우
            </button>
          </div>
        </div>

        {/* 꿀팁 영역: 항상 내 꿀팁 목록 표시 (검색은 /search에서) */}
        <div className="relative">
          {hasHydrated && typeof userNo === "number" && (
            <HexGridWithData<MyTipItem>
              key={`user-${userNo}`}
              fetcher={tipsFetcher}
              mapItem={(t) => ({ id: t.no, label: t.title || "(제목 없음)" })}
              imageSlotConfig={MYTIP_IMAGE_SLOTS}
              totalSlots={30}
              cols={5}
              emptyBg="#D9D9D9"
              onCardClick={(id) => router.push(`?modal=${id}`)}
            />
          )}

          <FloatingBtn />
        </div>

        {/* 꿀팁 상세 모달 (쿼리스트링 기반) */}
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

        {/*  팔로워 / 팔로잉 모달 */}
        {openFollowers && typeof userNo === "number" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <FollowerListModal
              targetUserNo={userNo}
              onClose={() => setOpenFollowers(false)}
            />
          </div>
        )}

        {openFollowings && typeof userNo === "number" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <FollowingListModal
              targetUserNo={userNo}
              onClose={() => setOpenFollowings(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}
