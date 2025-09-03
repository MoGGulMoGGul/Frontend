"use client";

import BellIconWithBadge from "../BellIconWithBadge";
import MenuItem from "../shared/MenuItem";
import ContextMenu from "../shared/ContextMenu";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useNotifications,
  useNotificationActions,
} from "./NotificationContext";
import Logout from "../icons/Logout";
import { useAuthStore } from "@/stores/useAuthStore";
import { logout } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useGroupStore } from "@/stores/useGroupStorageStore";
import { useUserStorageStore } from "@/stores/useUserStorageStore";
import { useEnsureUserStoragesLoaded } from "@/hooks/useEnsureUserStoragesLoaded";
import { useEnsureGroupsLoaded } from "@/hooks/useEnsureGroupsLoaded";
import CommonModal from "../modal/CommonModal";
import OkBtn from "../common/OkBtn";
import { createPortal } from "react-dom";

function Sidebar() {
  const [showNotif, setShowNotif] = useState(false);
  const [modal, setModal] = useState<null | { message: string }>(null);
  const openModal = (message: string) => setModal({ message });
  const closeModal = () => setModal(null);
  const notifications = useNotifications();
  const { removeByIndex } = useNotificationActions();
  const router = useRouter();
  const pathname = usePathname();
  const bellRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(
    null
  );

  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const userNo = useAuthStore((s) => s.userNo);
  const nickname = useAuthStore((s) => s.nickname);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const loadUserProfile = useAuthStore((s) => s.loadUserProfile);

  useEffect(() => {
    if (!showNotif) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const el = bellRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setMenuPos({ left: r.left + r.width / 2, top: r.bottom + 8 });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [showNotif]);

  useEffect(() => {
    if (showNotif && notifications.length === 0) {
      setShowNotif(false);
    }
  }, [showNotif, notifications.length]);

  // 초기 1회 보장
  useEnsureGroupsLoaded();
  useEnsureUserStoragesLoaded(userNo);

  const bootOnce = useRef(false);
  useEffect(() => {
    if (userNo == null) return;
    if (bootOnce.current) return;
    bootOnce.current = true;

    // force 제거 → 스토어의 _inflight / _loadedOnce 가드가 동작
    useUserStorageStore
      .getState()
      .load(userNo)
      .catch(() => {});
  }, [userNo]);

  // /mytip 경로에서만 동기화 시도
  useEffect(() => {
    if (userNo == null) return;
    if (pathname === "/mytip" || pathname.startsWith("/mytip/")) {
      // force 제거 → 과도한 재호출 방지
      useUserStorageStore
        .getState()
        .load(userNo)
        .catch(() => {});
    }
  }, [pathname, userNo]);

  useEffect(() => {
    if (pathname === "/grouptip" || pathname.startsWith("/grouptip/")) {
      // 그룹쪽은 기존 로직 유지(필요시 동일하게 force 제거 고려)
      useGroupStore
        .getState()
        .load(true)
        .catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (userNo && !nickname) {
      loadUserProfile(userNo).catch(() => {});
    }
  }, [hasHydrated, userNo, nickname, loadUserProfile]);

  // 전역 상태
  const groups = useGroupStore((s) => s.groups);
  const myStorages = useUserStorageStore((s) => s.storages);

  const createGroup = useGroupStore((s) => s.create);
  const renameGroup = useGroupStore((s) => s.rename);
  const removeGroup = useGroupStore((s) => s.remove);

  const addStorage = useUserStorageStore((s) => s.add);
  const renameStorage = useUserStorageStore((s) => s.rename);
  const removeStorage = useUserStorageStore((s) => s.remove);

  const groupFolders = useMemo(
    () => groups.map((g) => ({ id: g.groupNo, name: g.name })),
    [groups]
  );
  const personalFolders = useMemo(
    () => myStorages.map((s) => ({ id: s.storageNo, name: s.name })),
    [myStorages]
  );

  // 그룹 핸들러
  const handleAddGroup = async (name: string) => {
    await createGroup(name.trim()).catch(() =>
      openModal("그룹 생성에 실패했습니다.")
    );
  };
  const handleRenameGroup = async (id: number, newName: string) => {
    if (!newName.trim()) return;
    await renameGroup(id, newName.trim()).catch(() =>
      openModal("그룹명 변경에 실패했습니다.")
    );
  };
  const handleDeleteGroup = async (id: number) => {
    await removeGroup(id).catch(() =>
      openModal("그룹에서 나가는것에 실패했습니다")
    );
  };

  // 개인 보관함 핸들러
  const handleAddStorage = async (name: string) => {
    try {
      const created = await addStorage(name.trim());
      router.push(`/mytip/storage?storageNo=${created.storageNo}`);
    } catch {
      openModal("보관함 생성에 실패했습니다.");
    }
  };
  const handleRenameStorage = async (id: number, newName: string) => {
    if (!newName.trim()) return;
    await renameStorage(id, newName.trim()).catch(() =>
      openModal("보관함 이름 변경에 실패했습니다.")
    );
  };
  const handleDeleteStorage = async (id: number) => {
    await removeStorage(id).catch(() =>
      openModal("보관함 삭제에 실패했습니다.")
    );
  };

  const handleLogout = async () => {
    try {
      if (accessToken) await logout(accessToken);
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  const safeNickname = hasHydrated
    ? nickname && nickname.trim()
      ? nickname.trim()
      : "사용자"
    : "내";

  return (
    <div className="h-full min-h-screen">
      {/* 공통 알림 모달 */}
      {modal && (
        <CommonModal onClose={closeModal}>
          <div className="min-w-[300px] text-center">
            <h3 className="text-lg font-semibold mb-2">알림</h3>
            <p className="text-sm text-gray-700 mb-4">{modal.message}</p>
            <div className="flex justify-end">
              <OkBtn label="확인" onClick={closeModal} />
            </div>
          </div>
        </CommonModal>
      )}
      <aside className="p-7 bg-[var(--color-honey-pastel)] h-full">
        <nav className="flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center place-content-between gap-2">
              <div className="text-xl font-semibold">
                {`${safeNickname}님의 꿀팁`}
              </div>

              <div
                ref={bellRef}
                className="relative"
                onClick={() => setShowNotif((prev) => !prev)}
              >
                <BellIconWithBadge count={notifications.length} />
                {showNotif &&
                  notifications.length > 0 &&
                  menuPos &&
                  createPortal(
                    <div
                      className="fixed z-40 max-w-[min(80vw,360px)]"
                      style={{
                        left: menuPos.left,
                        top: menuPos.top,
                        transform: "translateX(-50%)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ContextMenu
                        items={notifications.map((n, i) => ({
                          label: n.message,
                          onClick: () => {
                            openModal(
                              n.id != null ? "알림을 확인하셨습니다" : n.message
                            );
                            removeByIndex(i);
                          },
                        }))}
                        className="w-max max-w-[min(80vw,360px)]"
                        itemClassName="whitespace-pre-wrap break-words"
                        onClose={() => setShowNotif(false)}
                      />
                    </div>,
                    document.body
                  )}
              </div>
            </div>

            <hr className="border-t border-gray-300 my-4" />

            <ul>
              <MenuItem icon="🐝" label="마이페이지" href="/mypage" />

              {/* 내 보관함(개인) */}
              <MenuItem
                icon="🍯"
                label="내 보관함"
                showArrow
                folders={personalFolders}
                href="/mytip"
                onAdd={handleAddStorage}
                onRenameFolder={handleRenameStorage}
                onDeleteFolder={handleDeleteStorage}
                entityLabel="보관함"
                linkBuilder={(id) => `/mytip/storage?storageNo=${id}`}
              />

              <MenuItem icon="🔎" label="검색하기" href="/" />

              {/* 함께 보는 보관함(그룹) */}
              <MenuItem
                icon="👥"
                label="함께 보는 보관함"
                showArrow
                folders={groupFolders}
                href="/grouptip"
                onAdd={handleAddGroup}
                onRenameFolder={handleRenameGroup}
                onDeleteFolder={handleDeleteGroup}
                entityLabel="그룹"
                linkBuilder={(id) => `/grouptip/group?groupNo=${id}`}
              />

              <MenuItem icon="🏆" label="주간 꿀팁 챌린지" href="/challenge" />
            </ul>
          </div>

          <div
            className="mt-auto mb-4 text-gray-500 hover:text-black cursor-pointer flex items-center gap-2"
            onClick={handleLogout}
          >
            <Logout />
            <span>로그아웃</span>
          </div>
        </nav>
      </aside>
    </div>
  );
}

export default Sidebar;
