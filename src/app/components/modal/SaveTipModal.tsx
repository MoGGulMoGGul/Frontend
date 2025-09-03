"use client";

import { useEffect, useState } from "react";
import CommonModal from "./CommonModal";
import OkBtn from "../common/OkBtn";
import ModalCancelBtn from "./ModalCancelBtn";
import { useUserStorageStore } from "@/stores/useUserStorageStore";
import { saveBookMarkTip } from "@/lib/tips";
import { getAllGroupStorages } from "@/lib/storage"; // 그룹 보관함 전체 조회

type Props = {
  tipNo: number;
  onClose: () => void;
};

export default function SaveTipModal({ tipNo, onClose }: Props) {
  const { storages } = useUserStorageStore();

  // 선택된 그룹 보관함의 storageNo"
  const [selectedGroupNo, setSelectedGroupNo] = useState<number | null>(null);
  const [selectedStorageNo, setSelectedStorageNo] = useState<number | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  // 그룹 보관함 목록 상태
  const [groupStorages, setGroupStorages] = useState<
    { storageNo: number; name: string; userNo: number }[]
  >([]);

  // 결과 모달 상태
  const [result, setResult] = useState<null | {
    type: "success" | "error" | "info";
    message: string;
  }>(null);

  // 최초 1회: 그룹 보관함 전체 로드
  useEffect(() => {
    (async () => {
      try {
        const list = await getAllGroupStorages();
        setGroupStorages(list);
      } catch {
        // 조용히 실패하여 기존 흐름 유지
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!selectedStorageNo && !selectedGroupNo) {
        setResult({ type: "error", message: "저장할 위치를 선택하세요." });
        return;
      }

      // 그룹 보관함 선택 시: selectedGroupNo === 선택된 그룹 보관함의 storageNo
      if (!selectedStorageNo && selectedGroupNo) {
        await saveBookMarkTip({ tipNo, storageNo: selectedGroupNo });
        setResult({ type: "success", message: "보관함에 저장했어요." });
        return;
      }

      // 개인 보관함
      if (selectedStorageNo) {
        await saveBookMarkTip({ tipNo, storageNo: selectedStorageNo });
        setResult({ type: "success", message: "내 보관함에 저장했어요." });
        return;
      }
    } catch {
      setResult({
        type: "error",
        message: "저장에 실패했어요. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setSaving(false);
    }
  };

  // 공통 셀렉트 클래스 (ContextMenu 톤)
  const selectBase =
    "appearance-none w-full px-3 py-2 pr-9 rounded-md border border-gray-300 " +
    "bg-white text-black shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 " +
    "disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed";

  const chevron =
    "pointer-events-none absolute inset-y-0 right-2 flex items-center";

  const closeResult = () => {
    const ok = result?.type === "success";
    setResult(null);
    if (ok) onClose();
  };

  return (
    <CommonModal>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">저장할 장소 선택</h2>

        {/* 개인 보관함 (그대로) */}
        <div>
          <label className="block text-sm font-medium mb-1">내 보관함</label>
          <div className="relative">
            <select
              className={selectBase}
              value={selectedStorageNo ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setSelectedStorageNo(val);
                if (val !== null) setSelectedGroupNo(null); // 서로 배타
              }}
              disabled={selectedGroupNo !== null}
            >
              <option value="">선택 안 함</option>
              {storages.map((st) => (
                <option key={st.storageNo} value={st.storageNo}>
                  {st.name}
                </option>
              ))}
            </select>
            <span className={chevron}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.5 7.5l4.5 4.5 4.5-4.5" />
              </svg>
            </span>
          </div>
        </div>

        {/* 그룹 보관함: 이제 groupStorages(보관함 목록) 사용 */}
        <div>
          <label className="block text-sm font-medium mb-1">그룹 보관함</label>
          <div className="relative">
            <select
              className={selectBase}
              value={selectedGroupNo ?? ""} // 기존 상태명 그대로 사용
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setSelectedGroupNo(val); // storageNo를 상태에 저장
                if (val !== null) setSelectedStorageNo(null); // 서로 배타
              }}
              disabled={selectedStorageNo !== null}
            >
              <option value="">선택 안 함</option>
              {groupStorages.map((gs) => (
                <option key={gs.storageNo} value={gs.storageNo}>
                  {gs.name}
                </option>
              ))}
            </select>
            <span className={chevron}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.5 7.5l4.5 4.5 4.5-4.5" />
              </svg>
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <OkBtn label={saving ? "저장 중..." : "저장"} onClick={handleSave} />
          <ModalCancelBtn label="취소" onClose={onClose} />
        </div>
      </div>

      {/* 결과 모달 */}
      {result && (
        <CommonModal>
          <div className="p-4 rounded-md text-center bg-white">
            <div
              className={[
                "font-bold mb-1",
                result.type === "success" && "text-green-700",
                result.type === "error" && "text-red-700",
                result.type === "info" && "text-gray-800",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {result.type === "success"
                ? "성공"
                : result.type === "error"
                ? "오류"
                : "알림"}
            </div>
            <div className="whitespace-pre-line">{result.message}</div>
            <div className="flex justify-center mt-4">
              <OkBtn label="확인" onClick={closeResult} />
            </div>
          </div>
        </CommonModal>
      )}
    </CommonModal>
  );
}
