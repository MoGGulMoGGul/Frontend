"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import Tooltip from "./common/Tooltip";

export default function FloatingBtn() {
  const tooltipId = useId();
  const router = useRouter();

  return (
    <div className="fixed bottom-[6.53%] right-[6.41%]">
      <div className="relative group focus-within:z-50">
        {/* 툴팁 */}
        <Tooltip id={tooltipId} text="글쓰기" />
        {/* 버튼 */}
        <button
          onClick={() => {
            router.push("/newtip");
          }}
          aria-describedby={tooltipId}
          className=" w-16 h-16 rounded-full bg-[var(--color-honey-pale)] border border-[#6A3808] text-5xl text-[#6A3808] grid place-items-center leading-none hover:cursor-pointer"
        >
          <span className="relative top-[-4px]">+</span>
        </button>
      </div>
    </div>
  );
}
