import { useEffect, useRef } from "react";

export type ContextMenuItem = {
  label: string;
  onClick: () => void;
};

export type ContextMenuProps = {
  items: ContextMenuItem[];
  onClose: () => void;
  className?: string;
  itemClassName?: string;
};

const previewLabel = (s: string) => {
  const idx = s.search(/[.:]/); // 첫 '.' 또는 ':' 위치
  if (idx <= 0) return s; // 없거나 맨 앞이면 전체 그대로
  return s.slice(0, idx); // 그 전까지만 표시
};

export default function ContextMenu({
  items,
  onClose,
  className,
  itemClassName,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log("clicked", event.target);
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={[
        "bg-white shadow-md border rounded-md p-2 w-max max-w-sm whitespace-pre-wrap break-words z-100",
        className ?? "",
      ].join(" ")}
    >
      <ul>
        {items.map((item, index) => (
          <li
            key={index}
            className={[
              "hover:bg-gray-100 px-2 py-1 cursor-pointer",
              itemClassName ?? "",
            ].join(" ")}
            onClick={item.onClick}
          >
            {previewLabel(item.label)}
          </li>
        ))}
      </ul>
    </div>
  );
}
