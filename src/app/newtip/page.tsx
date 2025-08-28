"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { createTipDraft, registerTip, type TipDraftResponse } from "@/lib/tips";
import { useUserStorageStore } from "@/stores/useUserStorageStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEnsureUserStoragesLoaded } from "@/hooks/useEnsureUserStoragesLoaded";
import BoldLabeledField from "../components/form/BoldLabeledInput";
import CommonModal from "../components/modal/CommonModal";
import OkBtn from "../components/common/OkBtn";
import SearchBar from "../components/common/SearchBar";
import { useRouter } from "next/navigation"; // ✅ App Router
import { resolveLocalThumb } from "@/lib/resolveLocalThumb";

export default function NewtipPage() {
  const router = useRouter();
  const onClose = () => router.back();

  const userNo =
    useAuthStore((s) => (s as unknown as { userNo?: number }).userNo) ?? 1;

  useEnsureUserStoragesLoaded(userNo);
  const storages = useUserStorageStore((s) => s.storages);

  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(true);

  const [draftId, setDraftId] = useState<number | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [summarizing, setSummarizing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [storageNo, setStorageNo] = useState<number | "">("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [infoModal, setInfoModal] = useState<null | {
    message: string;
    onConfirm?: () => void;
  }>(null);

  const openInfo = (message: string, onConfirm?: () => void) => {
    setInfoModal({ message, onConfirm });
  };

  const handleModalClose = () => {
    const callback = infoModal?.onConfirm;
    setInfoModal(null);
    if (callback) callback();
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedText =
      e.dataTransfer.getData("text/uri-list") ||
      e.dataTransfer.getData("text/plain");
    if (droppedText) {
      setUrl(droppedText.trim());
      setThumbnailUrl(null);
      setDraftId(null); // URL 바뀌면 이전 초안 무효화(안전)
    }
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const tags = useMemo(
    () =>
      tagsInput
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput]
  );

  const validUrl = useMemo(() => /^https?:\/\/\S+$/i.test(url), [url]);
  const canSummarize = validUrl && !summarizing;
  const canSave = draftId !== null && !saving && storageNo !== "";

  const handleSummarize = async () => {
    if (!validUrl) {
      openInfo("올바른 URL을 입력하거나 드래그해 주세요.");
      return;
    }
    try {
      setSummarizing(true);
      setDraftId(null);
      setSummary("");
      setThumbnailUrl(null);

      const res: TipDraftResponse = await createTipDraft({
        url,
        title: title.trim() || undefined,
        tags: tags.length ? tags : undefined,
      });

      setDraftId(res.no);
      setSummary(res.contentSummary || "");

      if (!title && res.title) setTitle(res.title);
      if (!tagsInput && Array.isArray(res.tags) && res.tags.length > 0) {
        setTagsInput(res.tags.join(", "));
      }
      if (res.thumbnailUrl) {
        setThumbnailUrl(res.thumbnailUrl);
      }
    } catch (e) {
      console.error("요약 생성 실패:", e);
      openInfo("요약 생성에 실패했습니다.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleSave = async () => {
    if (!canSave || typeof storageNo !== "number") return;
    try {
      setSaving(true);
      await registerTip({
        tipNo: draftId as number,
        isPublic,
        storageNo,
      });
      openInfo("꿀팁이 저장되었습니다!", onClose);
    } catch (e) {
      console.error("꿀팁 저장 실패:", e);
      openInfo("꿀팁 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const thumbSrc = resolveLocalThumb(thumbnailUrl, "");

  // 공통 입력 스타일
  const fieldBase =
    "w-full max-w-[520px] h-11 px-3 rounded-md bg-[#f5f5f5] border border-gray-200 placeholder-gray-400 " +
    "focus:outline-none focus:ring-0 focus:border-gray-300";

  const selectBase =
    "w-full h-10 rounded-md px-3 bg-[#f5f5f5] border border-gray-200 placeholder-gray-400 " +
    "focus:outline-none focus:ring-0 focus:border-gray-300";

  return (
    <>
      {/* 검색어 입력 시 /search로 이동 (scope=public) */}
      <SearchBar
        placeholder="전체 꿀팁 검색"
        onSearch={(q) => {
          const keyword = (q ?? "").trim();
          if (!keyword) return;
          const params = new URLSearchParams({ scope: "public", q: keyword });
          router.push(`/search?${params.toString()}`);
        }}
      />

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
            {/* 왼쪽: 드래그/URL 영역 */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="w-1/2 bg-[#f7f7f7] border-2 border-dashed border-gray-300 flex flex-col justify-center items-center rounded-md p-6"
            >
              {thumbnailUrl ? (
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
                  if (draftId !== null) setDraftId(null);
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

            {/* 오른쪽: 메타 입력 */}
            <div className="w-1/2">
              <BoldLabeledField
                label="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="입력하지 않으면 AI가 생성해줍니다."
              />

              <BoldLabeledField
                label="요약"
                type="textarea"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="요약 결과가 여기에 표시됩니다."
              />

              <BoldLabeledField
                label="태그"
                placeholder="콤마 또는 공백으로 구분해 입력해주세요"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />

              {/* 공개 설정 */}
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

              {/* 저장 보관함 선택 */}
              <div className="mt-6">
                <div className="font-semibold mb-2">저장할 보관함</div>
                <select
                  value={storageNo}
                  onChange={(e) =>
                    setStorageNo(e.target.value ? Number(e.target.value) : "")
                  }
                  className={selectBase}
                >
                  <option value="">보관함을 선택하세요</option>
                  {storages.map((s) => (
                    <option key={s.storageNo} value={s.storageNo}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
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
