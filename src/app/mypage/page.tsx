"use client";

import Image from "next/image";
import Link from "next/link";
import SettingIcon from "../components/icons/SettingIcon";
import { useState, useEffect, useMemo } from "react";
import UserEditModal from "../components/modal/UserEditModal";
import FollowerListModal from "../components/common/FollowerListModal";
import { withdrawal } from "@/lib/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import CommonModal from "../components/modal/CommonModal";
import OkBtn from "../components/common/OkBtn";
import ModalCancelBtn from "../components/modal/ModalCancelBtn";
import SearchBar from "../components/common/SearchBar";
import { getUserProfile, type UserProfile } from "@/lib/user";

// 전역 보관함 스토어(읽기 전용) + add 액션 사용
import { useUserStorageStore } from "@/stores/useUserStorageStore";
import { resolveLocalThumb } from "@/lib/resolveLocalThumb";

export default function MyPage() {
  const router = useRouter();

  // 스토어에서 토큰/유저 정보/액션 사용
  const accessToken = useAuthStore((s) => s.accessToken);
  const userNo = useAuthStore((s) => s.userNo);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // 전역 보관함 상태(읽기 전용)
  const myStorages = useUserStorageStore((s) => s.storages);
  const myStoragesLoading = useUserStorageStore((s) => s.loading);
  const myStoragesError = useUserStorageStore((s) => s.error);
  const loadUserProfile = useAuthStore((s) => s.loadUserProfile);

  // UI 상태
  const [showUserEdit, setShowUserEdit] = useState(false);
  const [showFollowerList, setShowFollowerList] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  // 피드백 모달
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // 회원정보
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // 보관함 생성 모달 & 입력 상태
  const [showCreateStorage, setShowCreateStorage] = useState(false);
  const [newStorageName, setNewStorageName] = useState("");
  const [creating, setCreating] = useState(false);

  const openToast = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
  };

  // add 액션
  const addStorage = useUserStorageStore((s) => s.add);

  // 보관함 생성 핸들러
  const handleCreateStorage = async () => {
    const name = newStorageName.trim();
    if (!name) {
      openToast("보관함 이름을 입력해 주세요.");
      return;
    }

    if (typeof userNo !== "number") {
      openToast("로그인이 필요합니다. 다시 로그인해 주세요.");
      setShowCreateStorage(false);
      setTimeout(() => router.push("/login"), 200);
      return;
    }

    try {
      setCreating(true);
      const created = await addStorage(name);
      setShowCreateStorage(false);
      setNewStorageName("");
      openToast("보관함이 생성되었습니다.");
      router.push(`/mytip/storage?storageNo=${created.storageNo}`);
    } catch {
      openToast("보관함 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setCreating(false);
    }
  };

  // 회원탈퇴
  const handleWithdrawal = async () => {
    if (!accessToken) {
      openToast("로그인이 필요합니다. 다시 로그인해 주세요.");
      setShowWithdrawalModal(false);
      setTimeout(() => router.push("/login"), 200);
      return;
    }

    try {
      await withdrawal(accessToken);
      clearAuth();
      setShowWithdrawalModal(false);
      openToast("회원탈퇴가 완료되었습니다.");
      setTimeout(() => router.push("/"), 300);
    } catch {
      setShowWithdrawalModal(false);
      openToast("회원탈퇴에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  // userNo로 유저정보 조회
  useEffect(() => {
    if (typeof userNo !== "number") return;
    setLoading(true);
    getUserProfile(userNo)
      .then(setProfile)
      .catch(() => {
        openToast("유저 정보를 불러오지 못했어요.");
      })
      .finally(() => setLoading(false));
  }, [userNo]);

  // 프로필 재조회
  const refetchProfile = async () => {
    if (typeof userNo !== "number") return;
    setLoading(true);
    try {
      const p = await getUserProfile(userNo);
      setProfile(p);
    } catch {
      openToast("유저 정보를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  // 카드 데이터
  const personalFolders = useMemo(
    () => myStorages.map((s) => ({ id: s.storageNo, name: s.name })),
    [myStorages]
  );

  return (
    <>
      {/* 내 꿀팁 검색으로 /search 이동 */}
      <SearchBar
        placeholder="내 꿀팁 검색"
        onSearch={(q) => {
          const keyword = (q ?? "").trim();
          if (!keyword) return;
          const params = new URLSearchParams({ scope: "my", q: keyword });
          router.push(`/search?${params.toString()}`);
        }}
      />
      <div className="relative p-6 pt-0">
        <div className="flex flex-col items-center">
          <div className="w-full bg-[rgba(249,217,118,0.52)] rounded-4xl py-5 px-8 mb-16">
            <div className="flex items-center h-full justify-between">
              <div className="flex items-center">
                <div className="relative w-24 h-24 rounded-full bg-gray-300 mr-2 overflow-hidden">
                  <Image
                    src={resolveLocalThumb(
                      profile?.profileImageUrl,
                      "/img/1bee.png"
                    )}
                    alt="프로필 이미지"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-xl">
                      {loading
                        ? "불러오는 중..."
                        : profile?.nickname || "(닉네임 없음)"}
                    </div>
                    <button
                      aria-label="프로필 수정"
                      onClick={() => setShowUserEdit(true)}
                      className="cursor-pointer"
                      title="프로필 수정"
                    >
                      <SettingIcon />
                    </button>
                  </div>
                  <div className="text-[#979696]">{profile?.loginId || ""}</div>
                </div>
              </div>

              {/* 다른 유저들이 모아간 내 꿀팁 */}
              <div className="relative flex flex-col text-center pr-12">
                <div className="w-10 aspect-[2/3] absolute -top-6 right-[-10px] sm:right-0 md:right-[8px]">
                  <Image
                    src="/img/honeyjar.png"
                    alt="꿀"
                    width={100}
                    height={150}
                    className="object-contain pointer-events-none"
                  />
                </div>
                <div className="text-[10px] font-semibold relative z-10">
                  다른 유저들이 모아간 내 꿀팁
                </div>
                <div className="text-2xl font-extrabold relative z-10">
                  {profile?.totalBookmarkCount}개
                </div>
              </div>

              {/* 오른쪽: 팔로워 수 */}
              <button
                type="button"
                onClick={() => setShowFollowerList(true)}
                className="relative flex flex-col text-center group focus:outline-none"
                aria-haspopup="dialog"
                aria-expanded={showFollowerList}
                title="팔로워 목록 보기"
              >
                <div className="w-10 aspect-[2/3] absolute -top-6 left-[50px] opacity-80 transition-opacity">
                  <Image
                    src="/img/1bee.png"
                    alt="꿀벌"
                    width={40}
                    height={60}
                    className="object-contain pointer-events-none"
                  />
                </div>
                <div className="text-[10px] font-semibold relative z-10">
                  팔로워 수
                </div>
                <div className="text-2xl font-extrabold relative z-10">
                  {profile?.followerCount}
                </div>
              </button>

              {/* 회원탈퇴 버튼 */}
              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="w-24 h-12 rounded-xl border border-[var(--color-honey-pale)] bg-white hover:bg-[var(--color-honey-pale)] cursor-pointer"
              >
                회원탈퇴
              </button>
            </div>
          </div>

          {/* 전역 스토어만 읽어 벌집 카드 렌더 */}
          <main className="relative z-10 mb-20">
            {myStoragesLoading ? (
              <div className="py-6 text-center text-gray-500">
                보관함 불러오는 중...
              </div>
            ) : myStoragesError ? (
              <div className="py-6 text-center text-red-600">
                {myStoragesError}
              </div>
            ) : personalFolders.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                아직 보관함이 없어요. 사이드바에서 보관함을 추가해보세요!
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-4 items-center">
                {personalFolders.map((folder) => (
                  <Link
                    key={folder.id}
                    href={`/mytip/storage?storageNo=${folder.id}`}
                    className="flex flex-col hover:cursor-pointer font-bold"
                    title={folder.name}
                    prefetch={false}
                  >
                    <div className="relative mb-3">
                      <Image
                        src="/img/벌집.png"
                        alt="벌꿀"
                        width={115}
                        height={129}
                      />
                      <Image
                        src="/img/1bee.png"
                        alt="벌"
                        width={23}
                        height={24}
                        className="absolute bottom-[16px] left-[80px] pointer-events-none"
                      />
                    </div>
                    <div className="text-center max-w-[120px] truncate">
                      {folder.name}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

          {/* (+) 버튼 */}
          <button
            className="w-11 h-11 rounded-full bg-[#d9d9d9] text-5xl grid place-items-center"
            aria-label="개인 보관함 추가"
            onClick={() => setShowCreateStorage(true)}
          >
            <span className="relative top-[-6px]">+</span>
          </button>

          {/* ────────────────────────── 모달들 ────────────────────────── */}
          {/* 보관함 생성 모달 */}
          {showCreateStorage && (
            <CommonModal onClose={() => setShowCreateStorage(false)}>
              <div className="w-full max-w-sm">
                <h2 className="text-lg font-bold mb-4">
                  새 개인 보관함 만들기
                </h2>
                <label className="block text-sm mb-2" htmlFor="storageName">
                  보관함 이름
                </label>
                <input
                  id="storageName"
                  autoFocus
                  type="text"
                  value={newStorageName}
                  onChange={(e) => setNewStorageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateStorage();
                    if (e.key === "Escape") setShowCreateStorage(false);
                  }}
                  className="w-full rounded-md border p-2"
                  placeholder="예: 개발 북마크"
                  disabled={creating}
                />
                <div className="mt-5 flex gap-2 justify-end">
                  <ModalCancelBtn
                    label="취소"
                    onClose={() => setShowCreateStorage(false)}
                  />
                  <OkBtn
                    label={creating ? "생성 중..." : "생성"}
                    onClick={handleCreateStorage}
                  />
                </div>
              </div>
            </CommonModal>
          )}

          {showUserEdit && profile && (
            <UserEditModal
              initialNickname={profile.nickname}
              initialImageUrl={profile.profileImageUrl}
              onClose={() => setShowUserEdit(false)}
              onSaved={async (msg) => {
                setShowUserEdit(false);
                openToast(msg ?? "프로필이 수정되었습니다.");
                await refetchProfile();
                if (typeof userNo === "number") {
                  try {
                    await loadUserProfile(userNo);
                  } catch {
                    /* no-op */
                  }
                }
              }}
            />
          )}

          {showFollowerList && typeof userNo === "number" && (
            <FollowerListModal
              targetUserNo={userNo}
              onClose={() => setShowFollowerList(false)}
            />
          )}

          {/* 회원탈퇴 확인 모달 */}
          {showWithdrawalModal && (
            <CommonModal>
              <div className="flex flex-col items-center gap-6">
                <p className="text-lg font-semibold">정말 탈퇴하시겠습니까?</p>
                <div className="flex gap-3">
                  <OkBtn
                    label="네"
                    onClick={() => {
                      setShowWithdrawalModal(false);
                      handleWithdrawal();
                    }}
                  />
                  <ModalCancelBtn
                    label="아니오"
                    onClose={() => setShowWithdrawalModal(false)}
                  />
                </div>
              </div>
            </CommonModal>
          )}

          {/* 안내/에러 모달 */}
          {toastOpen && (
            <CommonModal>
              <div className="flex flex-col items-center gap-4">
                <p className="text-base">{toastMsg}</p>
                <OkBtn label="확인" onClick={() => setToastOpen(false)} />
              </div>
            </CommonModal>
          )}
        </div>
      </div>
    </>
  );
}
