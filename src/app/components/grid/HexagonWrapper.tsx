import clsx from "clsx";
import { ReactNode } from "react";

export default function HexagonWrapper({
  children,
  className = "",
  bg = "#D9D9D9",
  rotate,
}: {
  children?: ReactNode;
  className?: string;
  bg?: string;
  rotate?: string;
}) {
  return (
    <div
      className={clsx("hex hex-ar hex-center w-full transform-gpu", className)}
      style={{
        backgroundColor: bg,
        ...(rotate ? { transform: `rotate(${rotate})` } : {}),
        willChange: "clip-path, background-color",
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </div>
  );
}
