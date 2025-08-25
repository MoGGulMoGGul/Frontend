"use client";

import CommonModal from "./CommonModal";
import OkBtn from "../common/OkBtn";
import ModalCancelBtn from "./ModalCancelBtn";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title = "확인",
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  confirming,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <CommonModal>
      <div className="p-4 rounded-md bg-white border border-gray-200 text-black shadow-md">
        <div className="font-bold mb-2">{title}</div>
        <div className="whitespace-pre-line">{message}</div>
        <div className="flex justify-center gap-2 mt-4">
          <OkBtn
            label={confirming ? "진행 중..." : confirmLabel}
            onClick={onConfirm}
          />
          <ModalCancelBtn label={cancelLabel} onClose={onCancel} />
        </div>
      </div>
    </CommonModal>
  );
}
