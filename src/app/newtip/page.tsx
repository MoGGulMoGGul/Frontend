"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createTipDraft, registerTip, type TipDraftResponse } from "@/lib/tips";
import { useUserStorageStore } from "@/stores/useUserStorageStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEnsureUserStoragesLoaded } from "@/hooks/useEnsureUserStoragesLoaded";
import BoldLabeledField from "../components/form/BoldLabeledInput";
import CommonModal from "../components/modal/CommonModal";
import OkBtn from "../components/common/OkBtn";
import SearchBar from "../components/common/SearchBar";
import { resolveLocalThumb } from "@/lib/resolveLocalThumb";

// 그룹 보관함 API/타입
import { getStoragesByGroup, type GroupStorageItem } from "@/lib/storage";

export default function NewtipPage() {
  const router = useRouter();
  const onClose = () => router.back();

  const sp = useSearchParams();

  // storageNo, groupNo
  const storageNoFromQuery = useMemo(() => {
    const v = sp.get("storageNo");
    const n = v == null ? NaN : Number(v);
    return Number.isFinite(n) ? n : null;
  }, [sp]);

  const groupNoFromQuery = useMemo(() => {
    const v = sp.get("groupNo");
    const n = v == null ? NaN : Number(v);
    return Number.isFinite(n) ? n : null;
  }, [sp]);

  const storageNameFromQuery = sp.get("storageName");

  const userNo =
    useAuthStore((s) => (s as unknown as { userNo?: number }).userNo) ?? 1;

  // 개인 보관함(전역)
  useEnsureUserStoragesLoaded(userNo);
  const personalStorages = useUserStorageStore((s) => s.storages);

  // 그룹 보관함(로컬)
  const [groupStorages, setGroupStorages] = useState<GroupStorageItem[] | null>(
    null
  );
  const [groupStoragesLoading, setGroupStoragesLoading] = useState(false);

  // --- 입력 상태 ---
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");

  // --- 생성 후 추가 입력 ---
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [storageNo, setStorageNo] = useState<number | "">("");

  // storageNo가 오면 저장 대상 고정
  useEffect(() => {
    if (storageNoFromQuery != null) {
      setStorageNo(storageNoFromQuery);
    }
  }, [storageNoFromQuery]);

  const isStorageFixed = storageNoFromQuery != null;

  // storageNo가 없고 groupNo가 있으면 그룹 보관함 목록 로딩
  useEffect(() => {
    let alive = true;
    (async () => {
      if (isStorageFixed) return;
      if (groupNoFromQuery == null) return;

      try {
        setGroupStoragesLoading(true);
        const list = await getStoragesByGroup(groupNoFromQuery);
        if (!alive) return;
        setGroupStorages(list);
      } catch (err: unknown) {
        console.error("그룹 보관함 목록 로딩 실패:", err);
        if (!alive) return;
        setGroupStorages([]);
      } finally {
        if (!alive) return;
        setGroupStoragesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [groupNoFromQuery, isStorageFixed]);

  // --- 응답/진행 상태 ---
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [summarizing, setSummarizing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [infoModal, setInfoModal] = useState<null | {
    message: string;
    onConfirm?: () => void;
  }>(null);

  const openInfo = (message: string, onConfirm?: () => void) => {
    setInfoModal({ message, onConfirm });
  };
  const handleModalClose = () => {
    const cb = infoModal?.onConfirm;
    setInfoModal(null);
    if (cb) cb();
  };

  // 드래그로 URL 입력
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedText =
      e.dataTransfer.getData("text/uri-list") ||
      e.dataTransfer.getData("text/plain");
    if (droppedText) {
      setUrl(droppedText.trim());
      setHasDraft(false);
      setSummary("");
      setThumbnailUrl(null);
    }
  };
  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 파생값
  const tags = useMemo(
    () =>
      tagsInput
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput]
  );
  const validUrl = useMemo(() => /^https?:\/\/\S+$/i.test(url), [url]);

  // 단계 플래그
  const canSummarize = validUrl && !summarizing;
  const canSave = hasDraft && !saving && storageNo !== "";

  // 1단계: 요약 생성
  const handleSummarize = async () => {
    if (!validUrl) {
      openInfo("올바른 URL을 입력하거나 드래그해 주세요.");
      return;
    }
    try {
      setSummarizing(true);
      setHasDraft(false);
      setSummary("");
      setThumbnailUrl(null);

      const res: TipDraftResponse = await createTipDraft({
        url,
        title: title.trim() || undefined,
        tags: tags.length ? tags : undefined,
      });

      setSummary(res.summary ?? "");
      if (!title && res.title) setTitle(res.title);
      if (!tagsInput && Array.isArray(res.tags) && res.tags.length > 0) {
        setTagsInput(res.tags.join(", "));
      }
      const thumb = res.thumbnailImageUrl ?? null;
      if (thumb) setThumbnailUrl(thumb);

      setHasDraft(true);
    } catch (err: unknown) {
      console.error("요약 생성 실패:", err);
      openInfo("요약 생성에 실패했습니다.");
    } finally {
      setSummarizing(false);
    }
  };

  // 2단계: 저장
  const handleSave = async () => {
    if (!canSave || typeof storageNo !== "number") return;

    const finalTitle = (title || "").trim();
    const finalSummary = (summary || "").trim();
    if (!finalTitle || !finalSummary) {
      openInfo("제목과 요약은 필수입니다.");
      return;
    }

    try {
      setSaving(true);
      await registerTip({
        url,
        title: finalTitle,
        summary: finalSummary,
        thumbnailImageUrl: thumbnailUrl || "",
        tags,
        storageNo, // 고정 storageNo 또는 드롭다운 선택값
        isPublic,
      });
      openInfo("꿀팁이 저장되었습니다!", onClose);
    } catch (err: unknown) {
      console.error("꿀팁 저장 실패:", err);
      openInfo("꿀팁 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const thumbSrc = resolveLocalThumb(thumbnailUrl, "");

  // 공통 스타일
  const fieldBase =
    "w-full max-w-[520px] h-11 px-3 rounded-md bg-[#f5f5f5] border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-gray-300";
  const selectBase =
    "w-full h-10 rounded-md px-3 bg-[#f5f5f5] border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-gray-300";

  // 드롭다운 렌더링 분기
  // storageNo 고정 → 안내만
  // storageNo 미고정 & groupNo 있음 → 그룹 보관함 드롭다운
  // 둘 다 없음 → 개인 보관함 드롭다운
  const renderStorageSelect = () => {
    if (isStorageFixed) {
      return (
        <div className="text-sm text-gray-700">
          이 꿀팁은{" "}
          <b>{storageNameFromQuery ?? `보관함 #${storageNoFromQuery}`}</b> 에
          저장됩니다.
        </div>
      );
    }
    if (groupNoFromQuery != null) {
      if (groupStoragesLoading) {
        return (
          <div className="text-sm text-gray-500">
            그룹 보관함 불러오는 중...
          </div>
        );
      }
      if ((groupStorages?.length ?? 0) === 0) {
        return (
          <div className="text-sm text-gray-500">
            이 그룹에는 보관함이 없습니다.
          </div>
        );
      }
      return (
        <select
          value={storageNo}
          onChange={(e) =>
            setStorageNo(e.target.value ? Number(e.target.value) : "")
          }
          className={selectBase}
        >
          <option value="">그룹 보관함을 선택하세요</option>
          {groupStorages!.map((s) => (
            <option key={s.storageNo} value={s.storageNo}>
              {s.name}
            </option>
          ))}
        </select>
      );
    }
    return (
      <select
        value={storageNo}
        onChange={(e) =>
          setStorageNo(e.target.value ? Number(e.target.value) : "")
        }
        className={selectBase}
      >
        <option value="">보관함을 선택하세요</option>
        {personalStorages.map((s) => (
          <option key={s.storageNo} value={s.storageNo}>
            {s.name}
          </option>
        ))}
      </select>
    );
  };

  return (
    <>
      {/* 상단 검색 */}
      <SearchBar
        placeholder="전체 꿀팁 검색"
        onSearch={(q) => {
          const keyword = (q ?? "").trim();
          if (!keyword) return;
          const params = new URLSearchParams({ scope: "public", q: keyword });
          router.push(`/search?${params.toString()}`);
        }}
      />

      {/* 안내 모달 */}
      {infoModal && (
        <CommonModal onClose={handleModalClose}>
          <div className="min-w-[300px] text-center">
            <h3 className="text-lg font-semibold mb-2">알림</h3>
            <p className="text-sm text-gray-700 mb-4">{infoModal.message}</p>
            <div className="flex justify-end">
              <OkBtn label="확인" onClick={handleModalClose} />
            </div>
          </div>
        </CommonModal>
      )}

      <div className="relative p-6 pt-0">
        <div className="flex flex-col">
          <div className="flex items-stretch gap-11 mb-20">
            {/* 왼쪽: URL/드롭 영역 */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="w-1/2 bg-[#f7f7f7] border-2 border-dashed border-gray-300 flex flex-col justify-center items-center rounded-md p-6"
            >
              {hasDraft && thumbnailUrl ? (
                <div className="w-full max-w-[520px] mb-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-200 bg-white">
                    <Image
                      src={thumbSrc}
                      alt="썸네일 미리보기"
                      fill
                      sizes="(max-width: 768px) 100vw, 520px"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-9xl mb-3.5 select-none">+</span>
                  <div className="mb-4 text-center">
                    저장하고 싶은 꿀팁의 <b>URL</b>을 드래그하거나 붙여넣기
                    해주세요
                  </div>
                </>
              )}

              <input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (thumbnailUrl) setThumbnailUrl(null);
                  if (hasDraft) setHasDraft(false);
                  if (summary) setSummary("");
                }}
                placeholder="https://example.com/article..."
                className={fieldBase}
              />

              {!validUrl && url && (
                <div className="mt-2 text-sm text-red-500">
                  올바른 URL 형식이 아닙니다.
                </div>
              )}
            </div>

            {/* 오른쪽: 입력 패널 */}
            <div className="w-1/2">
              {/* 1단계: 제목/태그 */}
              <BoldLabeledField
                label="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="입력하지 않으면 AI가 생성해줍니다."
              />

              <BoldLabeledField
                label="태그"
                placeholder="콤마 또는 공백으로 구분해 입력해주세요"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />

              {/* 2단계부터 요약/공개/보관함 */}
              {hasDraft && (
                <>
                  <BoldLabeledField
                    label="요약"
                    type="textarea"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="요약 결과가 여기에 표시됩니다."
                  />

                  <div className="mt-4">
                    <div className="font-semibold mb-2">공개 설정</div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={isPublic}
                          onChange={() => setIsPublic(true)}
                        />
                        공개
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={!isPublic}
                          onChange={() => setIsPublic(false)}
                        />
                        비공개
                      </label>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="font-semibold mb-2">저장할 보관함</div>
                    {renderStorageSelect()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 하단 액션 */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleSummarize}
              disabled={!canSummarize}
              className={`px-4 h-10 rounded-md border border-[var(--color-honey-pale)] ${
                canSummarize
                  ? "bg-[var(--color-honey-light)] hover:opacity-90"
                  : "bg-gray-200 opacity-60 cursor-not-allowed"
              }`}
            >
              {summarizing ? "요약 중..." : "내용 요약하기"}
            </button>

            {hasDraft && (
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`px-4 h-10 rounded-md ${
                  canSave
                    ? "bg-[var(--color-honey-light)] hover:opacity-90"
                    : "bg-gray-200 opacity-60 cursor-not-allowed"
                }`}
              >
                {saving ? "저장 중..." : "저장하기"}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 h-10 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
