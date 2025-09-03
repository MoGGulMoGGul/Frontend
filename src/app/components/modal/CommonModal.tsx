"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

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
  // 스크롤 잠금 + ESC 닫기
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const node = (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center mx-0"
      onClick={() => {
        if (closeOnBackdrop) onClose?.();
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

  return createPortal(node, document.body);
}
