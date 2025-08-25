import BellIcon from "./icons/BellIcon";

export default function BellIconWithBadge({ count }: { count: number }) {
  return (
    <div className="relative w-fit">
      <BellIcon />
      {count > 0 && (
        <span className="absolute -top-2.5 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
          {count}
        </span>
      )}
    </div>
  );
}
