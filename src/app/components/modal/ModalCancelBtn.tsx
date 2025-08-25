"use client";

export default function ModalCancelBtn({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) {
  return (
    <button
      className="flex px-5 py-1 bg-[#d9d9d9] border border-black/10 font-medium rounded-sm hover:cursor-pointer hover:bg-[black]/10"
      onClick={onClose}
    >
      {label}
    </button>
  );
}
