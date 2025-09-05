"use client";

import { useState, useRef, useEffect } from "react";
import Arrow from "../icons/Arrow";
import Ellipsis from "../icons/Elipsis";
import ContextMenu from "./ContextMenu";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CommonModal from "../modal/CommonModal";
import OkBtn from "../common/OkBtn";

/** ★ 끝 슬래시 제거 (루트 "/"는 유지) */
const normalizeBase = (p: string) => (p === "/" ? p : p.replace(/\/+$/, ""));

interface Folder {
  id: number;
  name: string;
}

interface MenuItemsProps {
  icon: string;
  label: string;
  href?: string;
  showArrow?: boolean;
  folders?: Folder[];
  onAdd?: (name: string) => Promise<void> | void;
  onRenameFolder?: (id: number, newName: string) => Promise<void> | void;
  onDeleteFolder?: (id: number) => Promise<void> | void;
  linkBuilder?: (id: number) => string;
  /** 모달 문구에 표시할 엔티티명 ("그룹" | "보관함") */
  entityLabel?: string;
  /** 닫힘→열림 될 때 한 번 호출 (목록 로드 트리거용) */
  onExpand?: () => void;
}

export default function MenuItem({
  icon,
  label,
  href = "#",
  showArrow = false,
  folders = [],
  onAdd,
  onRenameFolder,
  onDeleteFolder,
  linkBuilder,
  entityLabel = "항목",
  onExpand,
}: MenuItemsProps) {
  const [isArrowUp, setIsArrowUp] = useState(false);
  const [contextOpenId, setContextOpenId] = useState<number | null>(null);
  const [editFolderId, setEditFolderId] = useState<number | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [folderNames, setFolderNames] = useState<Record<number, string>>({});
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [infoModal, setInfoModal] = useState<null | { message: string }>(null);
  const openInfo = (message: string) => setInfoModal({ message });

  const wrapperRef = useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  /** ★ 여기서 한 번만 정규화해서 아래 전부 동일 값 사용 */
  const hrefBase = normalizeBase(href);

  const openAddModal = () => {
    setAddName("");
    setAddOpen(true);
  };

  const confirmAdd = async () => {
    if (addLoading) return; // 재진입 가드
    const name = addName.trim();
    if (!name) return;
    try {
      setAddLoading(true);
      await onAdd?.(name);
      setAddOpen(false);
    } finally {
      setAddLoading(false);
    }
  };

  useEffect(() => {
    const next = folders.reduce<Record<number, string>>((acc, f) => {
      acc[f.id] = f.name;
      return acc;
    }, {});
    const sameLen =
      Object.keys(next).length === Object.keys(folderNames).length;
    const sameValues =
      sameLen &&
      Object.entries(next).every(([k, v]) => folderNames[Number(k)] === v);

    if (!sameValues) setFolderNames(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders]);

  // 라우트가 현재 섹션을 가리키는지 계산 + active 폴더 표시
  useEffect(() => {
    if (!showArrow || hrefBase === "#") return;

    const inSection =
      pathname === hrefBase || pathname.startsWith(hrefBase + "/");
    if (isArrowUp !== inSection) setIsArrowUp(inSection);

    if (inSection) {
      const rest = pathname.slice(hrefBase.length);
      const firstSeg = rest.startsWith("/") ? rest.split("/")[1] : "";
      const maybeId = Number(firstSeg);
      const newActive =
        Number.isFinite(maybeId) && folders.some((f) => f.id === maybeId)
          ? maybeId
          : null;

      if (activeFolderId !== newActive) setActiveFolderId(newActive);
    } else {
      if (activeFolderId !== null) setActiveFolderId(null);
      if (contextOpenId !== null) setContextOpenId(null);
      if (editFolderId !== null) setEditFolderId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hrefBase, showArrow, folders]);

  // 라우팅으로 들어와서 처음 열릴 때도 onExpand 한 번 호출
  useEffect(() => {
    if (!showArrow || hrefBase === "#") return;
    const inSection =
      pathname === hrefBase || pathname.startsWith(hrefBase + "/");
    if (inSection && !isArrowUp) {
      setIsArrowUp(true);
      onExpand?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hrefBase, showArrow]);

  const toggleArrow = () => {
    const inSection =
      pathname === hrefBase || pathname.startsWith(hrefBase + "/");

    if (inSection) {
      setIsArrowUp((prev) => {
        const next = !prev;
        if (!prev && next) onExpand?.(); // 닫힘→열림 시 로드
        return next;
      });
    } else {
      setIsArrowUp(true);
      onExpand?.(); // 다른 섹션에서 처음 열릴 때 로드
    }
  };

  const toggleContextMenu = (folderId: number) => {
    setContextOpenId((prev) => (prev === folderId ? null : folderId));
  };

  const openInlineRename = (folderId: number) => {
    setEditFolderId(folderId);
    setContextOpenId(null);
  };

  const saveInlineRename = async (folderId: number) => {
    const next = (folderNames[folderId] ?? "").trim();
    const original = folders.find((f) => f.id === folderId)?.name ?? "";
    setEditFolderId(null);
    if (!next || next === original) return;

    try {
      if (onRenameFolder) {
        await onRenameFolder(folderId, next);
        setFolderNames((prev) => ({ ...prev, [folderId]: next }));
      } else {
        setFolderNames((prev) => ({ ...prev, [folderId]: next }));
      }
    } catch {
      openInfo(`${entityLabel} 이름 변경에 실패했습니다.`);
      setFolderNames((prev) => ({ ...prev, [folderId]: original }));
    }
  };

  const handleInputBlur = (folderId: number) => {
    void saveInlineRename(folderId);
  };
  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    folderId: number
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      const original = folders.find((f) => f.id === folderId)?.name ?? "";
      setFolderNames((prev) => ({ ...prev, [folderId]: original }));
      setEditFolderId(null);
    }
  };

  const handleNameChange = (folderId: number, newName: string) => {
    setFolderNames((prev) => ({ ...prev, [folderId]: newName }));
  };

  const openDeleteModal = (folderId: number) => {
    setContextOpenId(null);
    setDeleteTargetId(folderId);
  };

  const confirmDelete = async () => {
    if (deleteTargetId == null) return;
    try {
      setActionLoading(true);
      if (onDeleteFolder) {
        await onDeleteFolder(deleteTargetId);
      }
      if (
        hrefBase !== "#" &&
        (pathname === `${hrefBase}/${deleteTargetId}` ||
          pathname.startsWith(`${hrefBase}/${deleteTargetId}/`))
      ) {
        router.push(hrefBase);
      }
      setDeleteTargetId(null);
    } catch {
      openInfo(`${entityLabel} 삭제에 실패했습니다.`);
    } finally {
      setActionLoading(false);
    }
  };

  const menuItems = (folderId: number) => [
    { label: "이름변경", onClick: () => openInlineRename(folderId) },
    { label: "삭제하기", onClick: () => openDeleteModal(folderId) },
  ];

  return (
    <li ref={wrapperRef}>
      {/* ★ 공통 알림 모달 */}
      {infoModal && (
        <CommonModal onClose={() => setInfoModal(null)}>
          <div className="min-w-[300px] text-center">
            <h3 className="text-lg font-semibold mb-2">알림</h3>
            <p className="text-sm text-gray-700 mb-4">{infoModal.message}</p>
            <div className="flex justify-end">
              <OkBtn label="확인" onClick={() => setInfoModal(null)} />
            </div>
          </div>
        </CommonModal>
      )}
      {deleteTargetId !== null && (
        <CommonModal>
          <div className="min-w-[300px] text-center">
            <h3 className="text-lg font-semibold mb-2">{entityLabel} 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              이 {entityLabel}을 삭제하시겠어요? 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 h-10 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={actionLoading}
                className="px-4 h-10 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-60"
              >
                삭제
              </button>
            </div>
          </div>
        </CommonModal>
      )}

      <Link
        href={hrefBase}
        prefetch={false}
        className="h-12 flex items-center place-content-between text-lg"
        onClick={(e) => {
          if (hrefBase === "#") e.preventDefault(); // 해시 점프 방지
          toggleArrow();
        }}
      >
        <div className="flex items-center">
          <div className="w-7 h-7 rounded-full bg-white border border-[var(--color-honey-pale)] text-center flex items-center justify-center mr-2">
            {icon}
          </div>
          {label}
        </div>
        {showArrow && <Arrow direction={isArrowUp ? "up" : "down"} />}
      </Link>

      {showArrow && isArrowUp && (
        <>
          <button
            type="button"
            onClick={openAddModal}
            className="w-full h-9 rounded-lg border border-[var(--color-honey)] bg-[var(--color-honey-light)] mb-2"
          >
            + 추가하기
          </button>

          {addOpen && (
            <CommonModal onClose={() => setAddOpen(false)}>
              <div className="min-w-[320px]">
                <h3 className="text-lg font-semibold mb-2">
                  {entityLabel} 추가
                </h3>
                <input
                  autoFocus
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmAdd();
                    if (e.key === "Escape") setAddOpen(false);
                  }}
                  placeholder={`${entityLabel} 이름을 입력하세요`}
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
                    className="px-4 h-10 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={confirmAdd}
                    disabled={addLoading || !addName.trim()}
                    className="px-4 h-10 rounded-md bg-[var(--color-honey)] text-white hover:opacity-90 disabled:opacity-60"
                  >
                    추가
                  </button>
                </div>
              </div>
            </CommonModal>
          )}

          <ul className="mb-4">
            {folders.map((f) => {
              // ★ 폴더 링크 생성 시에도 정규화 보장
              const childHref = linkBuilder
                ? normalizeBase(linkBuilder(f.id))
                : `${hrefBase}/${f.id}`;

              return (
                <li key={f.id}>
                  <Link
                    href={childHref}
                    prefetch={false}
                    onClick={() => setActiveFolderId(f.id)}
                    className={`py-1 cursor-pointer flex items-center justify-between px-4 rounded-lg
                    ${
                      activeFolderId === f.id
                        ? "bg-[var(--color-honey-pale)]"
                        : "hover:bg-[var(--color-honey-pale)]"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {editFolderId === f.id ? (
                        <input
                          autoFocus
                          value={folderNames[f.id] ?? ""}
                          onChange={(e) =>
                            handleNameChange(f.id, e.target.value)
                          }
                          onBlur={() => handleInputBlur(f.id)}
                          onKeyDown={(e) => handleInputKeyDown(e, f.id)}
                          className="w-full px-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <span
                          className="block truncate"
                          title={folderNames[f.id]}
                        >
                          {folderNames[f.id]}
                        </span>
                      )}
                    </div>

                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleContextMenu(f.id);
                      }}
                      className="relative py-2 pl-2"
                    >
                      <Ellipsis />
                      {contextOpenId === f.id && (
                        <div className="absolute top-0 left-2 z-10">
                          <ContextMenu
                            items={menuItems(f.id)}
                            onClose={() => setContextOpenId(null)}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </li>
  );
}
