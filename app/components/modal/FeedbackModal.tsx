"use client";

import CommonModal from "./CommonModal";
import OkBtn from "../common/OkBtn";
import ModalCancelBtn from "./ModalCancelBtn";

type Variant = "success" | "error" | "info";

const tone: Record<Variant, { box: string; icon: string; label: string }> = {
  success: {
    box: "bg-green-50 border border-green-200 text-green-700",
    icon: "✅",
    label: "성공",
  },
  error: {
    box: "bg-red-50 border border-red-200 text-red-700",
    icon: "⚠️",
    label: "오류",
  },
  info: {
    box: "bg-gray-50 border border-gray-200 text-gray-800",
    icon: "ℹ️",
    label: "알림",
  },
};

type Props = {
  open: boolean;
  variant?: Variant;
  title?: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
  /** 자동 닫힘(ms). 필요 없으면 생략 */
  autoCloseMs?: number;
  /** 닫기 버튼 숨김 옵션 */
  hideClose?: boolean;
};

export default function FeedbackModal({
  open,
  variant = "info",
  title,
  message,
  confirmLabel = "확인",
  onClose,
  hideClose,
}: Props) {
  // autoClose
  // (의존성 줄이려고 useEffect 내장 안 함: 필요하면 상위에서 setTimeout으로 onClose 호출해도 됨)
  if (!open) return null;

  const t = tone[variant];

  return (
    <CommonModal>
      <div className={`p-4 rounded-md ${t.box}`}>
        <div className="flex items-start gap-3">
          <div className="text-xl leading-none">{t.icon}</div>
          <div className="flex-1">
            <div className="font-bold mb-1">{title ?? t.label}</div>
            <div className="whitespace-pre-line">{message}</div>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <OkBtn label={confirmLabel} onClick={onClose} />
          {!hideClose && <ModalCancelBtn label="닫기" onClose={onClose} />}
        </div>
      </div>
    </CommonModal>
  );
}
