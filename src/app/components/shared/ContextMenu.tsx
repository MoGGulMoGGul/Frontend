import { useEffect, useRef } from "react";

export type ContextMenuItem = {
  label: string;
  onClick: () => void;
};

export type ContextMenuProps = {
  items: ContextMenuItem[];
  onClose: () => void;
};

export default function ContextMenu({ items, onClose }: ContextMenuProps) {
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
      className="bg-white shadow-md border rounded-md p-2 w-32 whitespace-nowrap z-100"
    >
      <ul>
        {items.map((item, index) => (
          <li
            key={index}
            className="hover:bg-gray-100 px-2 py-1 cursor-pointer"
            onClick={item.onClick}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
