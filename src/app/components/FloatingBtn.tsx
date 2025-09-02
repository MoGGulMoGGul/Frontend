"use client";

import { useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Tooltip from "./common/Tooltip";

export default function FloatingBtn() {
  const tooltipId = useId();
  const router = useRouter();
  const sp = useSearchParams();

  // 현재 페이지 쿼리에서 storageNo, groupNo를 읽는다
  const storageNo = sp.get("storageNo");
  const groupNo = sp.get("groupNo");

  // 우선순위: storageNo > groupNo > 기본
  const storageName = sp.get("storageName");

  const dest = storageNo
    ? `/newtip?storageNo=${encodeURIComponent(storageNo)}${
        storageName ? `&storageName=${encodeURIComponent(storageName)}` : ""
      }`
    : groupNo
    ? `/newtip?groupNo=${encodeURIComponent(groupNo)}`
    : "/newtip";

  return (
    <div className="fixed bottom-[6.53%] right-[6.41%]">
      <div className="relative group focus-within:z-50">
        <Tooltip id={tooltipId} text="글쓰기" />
        <button
          onClick={() => router.push(dest)}
          aria-describedby={tooltipId}
          className="w-16 h-16 rounded-full bg-[var(--color-honey-pale)] border border-[#6A3808] text-5xl text-[#6A3808] grid place-items-center leading-none hover:cursor-pointer"
        >
          <span className="relative top-[-4px]">+</span>
        </button>
      </div>
    </div>
  );
}
