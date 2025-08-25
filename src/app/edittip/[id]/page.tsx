"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BoldLabeledField from "@/app/components/form/BoldLabeledInput";
import { getTipDetail, updateTip } from "@/lib/tips";
import { extractApiErrorMessage } from "@/lib/error";
import CommonModal from "@/app/components/modal/CommonModal";
import OkBtn from "@/app/components/common/OkBtn";
import ModalCancelBtn from "@/app/components/modal/ModalCancelBtn";
import { resolveLocalThumb } from "@/lib/resolveLocalThumb";
import SearchBar from "@/app/components/common/SearchBar";

export default function EditTipPage() {
  const { id } = useParams<{ id: string }>();
  const tipId = Number(id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [url, setUrl] = useState<string>("");

  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState<{ open: boolean; msg: string }>({
    open: false,
    msg: "",
  });

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const detail = await getTipDetail(tipId);
        if (!mounted) return;
        setTitle(detail.title ?? "");
        setSummary(detail.contentSummary ?? "");
        setTagsInput((detail.tags ?? []).join(", "));
        setIsPublic(!!detail.isPublic);
        setUrl(detail.url ?? "");
        setThumbnailUrl(detail.thumbnailUrl ?? null);
      } catch (e) {
        setErrorOpen({
          open: true,
          msg: extractApiErrorMessage(e) || "상세 정보를 불러오지 못했습니다.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tipId]);

  const tags = useMemo(
    () =>
      tagsInput
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput]
  );

  const canSave = !saving && title.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      await updateTip(tipId, {
        title: title.trim() || null,
        contentSummary: summary.trim() || null,
        isPublic,
        tags: tags.length ? tags : [],
      });
      setSuccessOpen(true);
    } catch (e) {
      setErrorOpen({
        open: true,
        msg: extractApiErrorMessage(e) || "수정에 실패했습니다.",
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldBase =
    "w-full max-w-[520px] h-11 px-3 rounded-md bg-[#f5f5f5] border border-gray-200 placeholder-gray-400 " +
    "focus:outline-none focus:ring-0 focus:border-gray-300";

  if (loading) return <div className="p-6">불러오는 중...</div>;

  const thumb = resolveLocalThumb(thumbnailUrl, "");

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
      <div className="relative p-6 pt-0">
        <div className="flex flex-col">
          <div className="flex items-stretch gap-11 mb-20">
            <div className="w-1/2 bg-[#f7f7f7] border-2 border-dashed border-gray-300 flex flex-col items-center rounded-md p-6">
              {/* 썸네일이 있을 때만 표시 */}
              {thumbnailUrl && (
                <div className="w-full max-w-[520px] mb-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-200 bg-white">
                    <Image
                      src={thumb}
                      alt="썸네일"
                      fill
                      sizes="(max-width: 768px) 100vw, 520px"
                      style={{ objectFit: "contain" }}
                      // 외부 도메인일 경우 next.config.js 이미지 도메인 설정 필요
                    />
                  </div>
                </div>
              )}

              <span className="text-xl mb-3.5 select-none">원본 URL</span>
              <input value={url} readOnly className={fieldBase} />
              <div className="mt-2 text-sm text-gray-500">
                URL은 수정할 수 없습니다.
              </div>
            </div>

            {/* 오른쪽: 메타 입력 */}
            <div className="w-1/2">
              <BoldLabeledField
                label="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <BoldLabeledField
                label="요약"
                type="textarea"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="요약 내용을 수정하세요."
              />
              <BoldLabeledField
                label="태그"
                placeholder="콤마 또는 공백으로 구분해 입력"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
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
            </div>
          </div>

          {/* 액션 */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`px-4 h-10 rounded-md ${
                canSave
                  ? "bg-[var(--color-honey-light)] hover:opacity-90"
                  : "bg-gray-200 opacity-60 cursor-not-allowed"
              }`}
            >
              {saving ? "수정 중..." : "수정하기"}
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 h-10 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
            >
              취소
            </button>
          </div>
        </div>
      </div>

      {/*성공 모달 */}
      {successOpen && (
        <CommonModal>
          <p className="text-center mb-4">수정되었습니다.</p>
          <div className="flex justify-center gap-2">
            <OkBtn
              label="확인"
              onClick={() => {
                setSuccessOpen(false);
                router.push("/");
                router.refresh?.();
              }}
            />
          </div>
        </CommonModal>
      )}

      {/* (옵션) 에러 모달 */}
      {errorOpen.open && (
        <CommonModal>
          <p className="text-center mb-4">{errorOpen.msg}</p>
          <div className="flex justify-center gap-2">
            <ModalCancelBtn
              label="닫기"
              onClose={() => setErrorOpen({ open: false, msg: "" })}
            />
          </div>
        </CommonModal>
      )}
    </>
  );
}
