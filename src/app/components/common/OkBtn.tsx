"use client";
import { MouseEventHandler } from "react";

export default function OkBtn({
  label,
  onClick,
}: {
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      className="flex px-5 py-1 bg-[var(--color-honey-light)] font-medium rounded-sm hover:cursor-pointer hover:bg-[var(--color-honey-light)]/70"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
