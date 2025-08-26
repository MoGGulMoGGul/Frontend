"use client";
import { MouseEventHandler } from "react";

export default function OkBtn({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      className={[
        "flex px-5 py-1 font-medium rounded-sm hover:cursor-pointer",
        "bg-[var(--color-honey-light)] hover:bg-[var(--color-honey-light)]/70",
        "disabled:opacity-60 disabled:pointer-events-none",
      ].join(" ")}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
