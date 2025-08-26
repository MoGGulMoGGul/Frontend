"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CommonModal from "@/app/components/modal/CommonModal";
import ModalDetailContent from "@/app/components/modal/ModalDetailContent";
import SearchBar from "@/app/components/common/SearchBar";
import HexGridWithData from "@/app/components/grid/HexGridWithData";
import { MYTIP_IMAGE_SLOTS } from "@/app/components/grid/TipImageSlots";

import {
  getStoragesByGroup,
  updateStorageName,
  deleteStorage,
  getStorageTips,
  type TipSearchItem as StorageTipItem,
} from "@/lib/storage";

type RouteParams = { groupNo: string; storageNo: string };

export default function GrouptipStoragePage() {
  const router = useRouter();
  const { groupNo: groupNoStr, storageNo: storageNoStr } =
    useParams() as RouteParams;
  const groupNo = Number(groupNoStr);
  const storageNo = Number(storageNoStr);

  const [name, setName] = useState("");
  const [loadingHeader, setLoadingHeader] = useState(true);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  // 기본(보관함 자체) 꿀팁 목록
  const [baseTips, setBaseTips] = useState<StorageTipItem[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [errorBase, setErrorBase] = useState<string | null>(null);

  // 이름 변경/삭제
  const [actionLoading, setActionLoading] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const searchParams = useSearchParams();
  const modalId = searchParams.get("modal");

  const [infoModal, setInfoModal] = useState<null | { message: string }>(null);
  const openInfo = (message: string) => setInfoModal({ message });

  // 헤더 + 기본 목록 로딩
  useEffect(() => {
    if (!Number.isFinite(groupNo) || !Number.isFinite(storageNo)) return;

    let alive = true;

    // 헤더(보관함 이름)는 그룹 목록에서 찾기
    (async () => {
      try {
        const list = await getStoragesByGroup(groupNo);
        if (!alive) return;
        const found = list.find((s) => s.storageNo === storageNo);
        if (found) {
          setName(found.name ?? "");
          setErrorHeader(null);
        } else {
          setErrorHeader("보관함을 찾을 수 없거나 권한이 없습니다.");
        }
      } catch (e) {
        console.error("보관함 헤더 조회 실패:", e);
        if (!alive) return;
        setErrorHeader("보관함을 불러오지 못했습니다.");
      } finally {
        if (!alive) return;
        setLoadingHeader(false);
      }
    })();

    // 본문(꿀팁 목록)은 그대로 유지: /api/query/storage/:storageNo
    (async () => {
      try {
        const tips = await getStorageTips(storageNo);
        if (!alive) return;
        setBaseTips(tips);
        setErrorBase(null);
      } catch (e) {
        console.error("보관함 꿀팁 목록 실패:", e);
        if (!alive) return;
        setErrorBase("보관함에 저장된 꿀팁을 불러오지 못했습니다.");
      } finally {
        if (!alive) return;
        setLoadingBase(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [groupNo, storageNo]);

  const handleRenameSave = async () => {
    const next = renameValue.trim();
    if (!next || next === name) {
      setShowRename(false);
      return;
    }
    try {
      setActionLoading(true);
      await updateStorageName(storageNo, next);
      setName(next);
      setShowRename(false);
    } catch (e) {
      console.error(e);
      openInfo("이름 변경에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      await deleteStorage(storageNo);
      setShowDelete(false);
      router.push(`/grouptip/${groupNo}`);
    } catch (e) {
      console.error(e);
      openInfo("보관함 삭제에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!Number.isFinite(groupNo) || !Number.isFinite(storageNo)) {
    return <main className="p-6">잘못된 경로입니다.</main>;
  }

  return (
    <>
      {infoModal && (
        <CommonModal onClose={() => setInfoModal(null)}>
          <div className="min-w-[300px] text-center">
            <h3 className="text-lg font-semibold mb-2">알림</h3>
            <p className="text-sm text-gray-700 mb-4">{infoModal.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setInfoModal(null)}
                className="px-4 h-10 rounded-md bg-[var(--color-honey-light)] hover:opacity-90"
              >
                확인
              </button>
            </div>
          </div>
        </CommonModal>
      )}
      {/*  그룹 단위 검색으로 변경: /api/search/tips/group/{groupId} */}
      <SearchBar
        placeholder="이 그룹에서 꿀팁 검색"
        onSearch={(q) => {
          const keyword = (q ?? "").trim();
          if (!keyword) return;
          const params = new URLSearchParams({
            scope: "group",
            groupId: String(groupNo),
            q: keyword,
          });
          router.push(`/search?${params.toString()}`);
        }}
      />

      <div className="relative p-6 pt-0">
        {/* 이름 변경 모달 */}
        {showRename && (
          <CommonModal>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-center">
                보관함 이름 변경
              </h3>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="새 보관함 이름"
                className="w-full border border-gray-300 rounded-md px-3 h-10 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRename(false)}
                  className="px-4 h-10 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  onClick={handleRenameSave}
                  disabled={actionLoading}
                  className="px-4 h-10 rounded-md bg-[var(--color-honey-light)] hover:opacity-90 disabled:opacity-60"
                >
                  저장
                </button>
              </div>
            </div>
          </CommonModal>
        )}

        {/* 삭제 확인 모달 */}
        {showDelete && (
          <CommonModal>
            <div className="min-w-[300px] text-center">
              <h3 className="text-lg font-semibold mb-2">보관함 삭제</h3>
              <p className="text-sm text-gray-600 mb-4">
                이 보관함을 삭제하시겠어요? 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDelete(false)}
                  className="px-4 h-10 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className="px-4 h-10 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-60"
                >
                  삭제
                </button>
              </div>
            </div>
          </CommonModal>
        )}

        {/* 헤더 */}
        <div className="w-full bg-[rgba(249,217,118,0.52)] rounded-3xl py-5 px-8 mb-10 relative">
          {loadingHeader ? (
            <div>불러오는 중...</div>
          ) : errorHeader ? (
            <div className="text-red-500">{errorHeader}</div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold truncate">
                {name || "보관함"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRenameValue(name);
                    setShowRename(true);
                  }}
                  disabled={actionLoading}
                  className="w-24 h-12 rounded-xl border border-[var(--color-honey-pale)] bg-white hover:bg-[var(--color-honey-pale)] hover:cursor-pointer disabled:opacity-60"
                >
                  이름 변경
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  disabled={actionLoading}
                  className="w-24 h-12 rounded-xl border border-[var(--color-honey-pale)] bg-white hover:bg-[var(--color-honey-pale)] hover:cursor-pointer disabled:opacity-60"
                >
                  보관함 삭제
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 본문: 기본 목록만 렌더 */}
        {loadingBase ? (
          <div>불러오는 중...</div>
        ) : errorBase ? (
          <div className="text-red-500">{errorBase}</div>
        ) : baseTips.length === 0 ? (
          <div className="text-center text-gray-500">
            이 보관함에 저장된 꿀팁이 없습니다.
          </div>
        ) : (
          <HexGridWithData<StorageTipItem>
            items={baseTips}
            externalLoading={false}
            fetcher={async () => []}
            mapItem={(t) => ({ id: t.id, label: t.title || "(제목 없음)" })}
            imageSlotConfig={MYTIP_IMAGE_SLOTS}
            totalSlots={30}
            cols={5}
            emptyBg="#D9D9D9"
            onCardClick={(id) => router.push(`?modal=${id}`)}
          />
        )}

        {/* 쿼리 기반 모달 */}
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
      </div>
    </>
  );
}
