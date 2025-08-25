"use client";

import { useEffect } from "react";

type CommonModalProps = {
  children: React.ReactNode;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
};

export default function CommonModal({
  children,
  onClose,
  closeOnBackdrop = true,
}: CommonModalProps) {
  // 스크롤 잠금 + ESC로 닫기(옵션)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center mx-0"
      onClick={() => {
        if (closeOnBackdrop && onClose) onClose();
      }}
    >
      <div
        className="bg-white p-6 rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
