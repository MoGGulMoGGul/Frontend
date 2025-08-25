"use client";
import type { ImageSlot } from "./HexGridWithData";

export const MYTIP_IMAGE_SLOTS: Record<number, ImageSlot> = {
  4: {
    src: "/img/1bee.png",
    width: "w-[80%]",
    height: "h-[80%]",
    top: "b-[-20%]",
    left: "left-[120%]",
    rotate: "rotate-[15deg]",
    transform: "translateX(-50%)",
    z: 5,
  },
  5: {
    src: "",
    width: "w-[110%]",
    height: "h-[110%]",
    top: "-top-5",
    left: "left-[50%]",
    transform: "translateX(-50%)",
  },
  10: {
    src: "",
    width: "w-[150%]",
    height: "h-[150%]",
    top: "-top-10",
    left: "left-[5]",
    rotate: "-rotate-[10deg]",
    transform: "translateX(-50%)",
  },
  11: {
    src: "/img/1bee.png",
    width: "w-[40%]",
    height: "h-[40%]",
    top: "-top-[30%]",
    left: "left-[85%]",
    rotate: "rotate-[-30deg]",
    transform: "translateX(-50%) scaleX(-1)",
    z: 30,
  },
  16: {
    src: "/img/1bee.png",
    width: "w-[280%]",
    height: "h-[28%]",
    top: "-top-[150%]",
    left: "left-[10%]",
    rotate: "rotate-[-30deg]",
    transform: "translateX(-50%) scaleX(-1)",
    z: 5,
  },
} as const;
