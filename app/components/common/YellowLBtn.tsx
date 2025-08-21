type YellowLBtnProps = {
  label: string;
  onClick?: () => void;
  className?: string;
};

export default function YellowLBtn({
  label,
  onClick,
  className,
}: YellowLBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-[var(--color-honey-light)] h-[40px] rounded-md mb-16 hover:cursor-pointer ${
        className ?? "w-full"
      }`}
    >
      {label}
    </button>
  );
}
