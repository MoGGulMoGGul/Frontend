interface ArrowProps {
  direction?: "down" | "up";
  className?: string;
}

export default function Arrow({
  direction = "down",
  className = "",
}: ArrowProps) {
  const rotation: Record<NonNullable<ArrowProps["direction"]>, string> = {
    down: "rotate-0",
    up: "rotate-180",
  };

  return (
    <svg
      width="16"
      height="10"
      viewBox="0 0 16 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform ${rotation[direction]} ${className}`}
    >
      <path
        d="M8 9.25L0.5 1.75L2.25 3.0598e-07L8 5.75L13.75 2.3167e-06L15.5 1.75L8 9.25Z"
        fill="#5B5860"
      />
    </svg>
  );
}
