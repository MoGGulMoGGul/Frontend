"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import CommonModal from "./CommonModal";
import { updateProfile } from "@/lib/user";
import { extractApiErrorMessage } from "@/lib/error";

type Props = {
  onClose: () => void;
  initialNickname: string;
  initialImageUrl: string;
  onSaved?: (message?: string) => void;
};

export default function UserEditModal({
  onClose,
  initialNickname,
  initialImageUrl,
  onSaved,
}: Props) {
  const [nickname, setNickname] = useState(initialNickname);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const changedNickname =
    nickname.trim() !== "" && nickname.trim() !== initialNickname.trim();
  const changedImage = file !== null;
  const hasChanges = changedNickname || changedImage;

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return initialImageUrl || "/img/1bee.png";
  }, [file, initialImageUrl]);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    e.currentTarget.value = ""; // 같은 파일 재선택 허용
  };

  const handleSave = async () => {
    if (!hasChanges) {
      setErrMsg("변경된 내용이 없습니다.");
      return;
    }
    setErrMsg(null);
    setSaving(true);

    try {
      // 변경된 항목만 payload에 담기
      const payload = {
        nickname: changedNickname ? nickname.trim() : undefined,
        image: changedImage && file ? file : undefined,
      } as const;

      await updateProfile(payload);
      onSaved?.("프로필이 성공적으로 수정되었습니다.");
      onClose();
    } catch (err) {
      setErrMsg(extractApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CommonModal>
      <div className="w-[680px]">
        <div className="flex justify-center mb-4 mt-10">
          <button
            type="button"
            onClick={handlePickImage}
            className="w-[170px] h-[170px] rounded-full relative overflow-hidden flex items-center justify-center ring-2 ring-transparent hover:ring-black/20 transition"
            aria-label="프로필 이미지 변경"
            title="프로필 이미지 변경"
          >
            <Image
              src={previewUrl}
              alt="프로필 이미지"
              fill
              className="object-cover"
            />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex justify-center mb-2">
          <button
            onClick={handlePickImage}
            className="px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50"
          >
            이미지 선택
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-[250px] border-0 border-b-2 border-gray-400 focus:outline-none focus:border-black text-center py-2"
            placeholder="닉네임을 입력하세요"
            maxLength={30}
          />
        </div>

        {errMsg && (
          <div className="mb-4 text-center text-red-600 text-sm">{errMsg}</div>
        )}

        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            disabled={saving}
          >
            취소하기
          </button>
          <button
            className="px-4 py-2 bg-[#F9D976] rounded disabled:opacity-50"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? "수정 중..." : "수정하기"}
          </button>
        </div>
      </div>
    </CommonModal>
  );
}
