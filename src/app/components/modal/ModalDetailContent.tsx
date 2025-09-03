"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ModalCancelBtn from "./ModalCancelBtn";
import TagList from "../common/TagList";
import OkBtn from "../common/OkBtn";
import CommonModal from "./CommonModal";
import { getTipDetail, deleteTip, type TipDetail } from "@/lib/tips";
import { extractApiErrorMessage } from "@/lib/error";
import { resolveLocalThumb } from "@/lib/resolveLocalThumb";
import { useAuthStore } from "@/stores/useAuthStore";
import SaveTipModal from "./SaveTipModal";

type Props = { id: number; onClose: () => void };

export default function ModalDetailContent({ id, onClose }: Props) {
  const router = useRouter();
  const [data, setData] = useState<TipDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const login = useAuthStore((s) => s.login);
  const myNickname = useAuthStore((s) => s.nickname);

  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorMsg(null);
    (async () => {
      try {
        const res = await getTipDetail(id);
        if (mounted) setData(res);
      } catch (err) {
        if (mounted) setErrorMsg(extractApiErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // 작성자 판별: 요구사항대로 "로그인한 사용자" ↔ "작성자 nickname" 비교
  const isOwner =
    !!data &&
    (data.nickname === (login ?? "") || data.nickname === (myNickname ?? ""));

  const handleEdit = () => {
    router.push(`/edittip?id=${id}`);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteTip(id);
      setConfirmOpen(false);
      onClose();
      router.refresh?.();
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-between gap-8 mb-5">
          <div className="relative w-[350px] h-[530px] border border-[#d9d9d9] rounded-lg bg-gray-100 animate-pulse" />
          <div className="w-[350px] flex flex-col">
            <div className="h-7 bg-gray-100 rounded mb-16 animate-pulse" />
            <div className="flex-1">
              <div className="h-7 bg-gray-100 rounded mb-2.5 animate-pulse" />
              <div className="h-24 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-[50px] h-[80px] bg-gray-100 rounded animate-pulse" />
              <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-5 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex justify-end">
          <ModalCancelBtn label="닫기" onClose={onClose} />
        </div>
      </>
    );
  }

  if (errorMsg) {
    return (
      <>
        <div className="p-6 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {errorMsg}
        </div>
        <div className="flex justify-end mt-4">
          <ModalCancelBtn label="닫기" onClose={onClose} />
        </div>
      </>
    );
  }

  const title = data?.title ?? "(제목 없음)";
  const rawThumb = data?.thumbnailUrl ?? null;
  const thumb = resolveLocalThumb(rawThumb, "/img/코어박살.jpg");
  const tags = data?.tags ?? [];
  const url = data?.url ?? "";
  const content = data?.contentSummary ?? "";
  const nickname = data?.nickname ?? "";
  const userNo = data?.userNo ?? "";

  return (
    <>
      <div className="flex justify-between gap-8 mb-5">
        <div className="relative w-[350px] h-[530px] border border-[#d9d9d9] rounded-lg">
          <Image
            key={thumb}
            src={thumb}
            alt={title}
            fill
            className="rounded-lg object-cover"
            sizes="350px"
            unoptimized={thumb?.startsWith?.("data:") ?? false}
          />
        </div>

        <div className="w-[350px] flex flex-col">
          <div
            className="font-bold text-2xl truncate whitespace-nowrap overflow-hidden mb-16"
            title={title}
          >
            {title}
          </div>

          <div className="flex-1">
            <div className="font-bold text-2xl mb-2.5">내용 요약</div>
            <div className="text-sm leading-relaxed whitespace-pre-line mb-8">
              {content || (
                <span className="text-gray-500">요약이 없습니다.</span>
              )}
            </div>
          </div>

          <div className="mb-16">
            <div className="font-bold text-2xl mb-2.5">태그</div>
            {tags.length ? (
              <TagList tags={tags} />
            ) : (
              <div className="text-sm text-gray-500">태그가 없습니다.</div>
            )}
          </div>

          {/* 버튼 영역: 꿀병은 항상, 우측 OkBtn은 소유자만 */}
          <div className="flex items-center justify-between mb-8">
            <Image
              src="/img/honeyjar.png"
              alt="저장버튼"
              width={50}
              height={80}
              className="rounded-lg object-cover cursor-pointer"
              onClick={() => setSaveOpen(true)}
            />
            {isOwner && (
              <div className="flex items-center gap-2">
                <OkBtn label="수정" onClick={handleEdit} />
                <OkBtn label="삭제" onClick={() => setConfirmOpen(true)} />
              </div>
            )}
          </div>

          <div className="truncate whitespace-nowrap overflow-hidden">
            출처:&nbsp;
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
                title={url}
              >
                {url}
              </a>
            ) : (
              <span className="text-gray-500">URL 없음</span>
            )}
          </div>

          <div className="truncate whitespace-nowrap overflow-hidden mt-1">
            닉네임:&nbsp;
            {nickname ? (
              <Link
                href={`/user?userNo=${userNo}`}
                className="text-blue-600 underline"
                title={nickname}
              >
                {nickname}
              </Link>
            ) : (
              <span className="text-gray-500">알 수 없음</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <ModalCancelBtn label="닫기" onClose={onClose} />
      </div>

      {/* 삭제 확인 모달 */}
      {confirmOpen && (
        <CommonModal>
          <p className="text-center mb-4">정말로 이 꿀팁을 삭제하시겠어요?</p>
          <div className="flex justify-center gap-2">
            <OkBtn
              label={deleting ? "삭제 중..." : "삭제"}
              onClick={handleDelete}
            />
            <ModalCancelBtn
              label="취소"
              onClose={() => setConfirmOpen(false)}
            />
          </div>
        </CommonModal>
      )}
      {saveOpen && (
        <SaveTipModal tipNo={id} onClose={() => setSaveOpen(false)} />
      )}
    </>
  );
}
