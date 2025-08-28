"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import CommonModal from "../components/modal/CommonModal";
import OkBtn from "../components/common/OkBtn";
import ModalCancelBtn from "../components/modal/ModalCancelBtn";
import LabeledInput from "../components/form/LabeledInput";
import YellowLBtn from "../components/common/YellowLBtn";
import { useGroupStore } from "@/stores/useGroupStorageStore";
import { useRouter } from "next/navigation";
import SearchBar from "../components/common/SearchBar";

export default function GrouptipPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "" });

  const groups = useGroupStore((s) => s.groups);
  const loading = useGroupStore((s) => s.loading);
  const load = useGroupStore((s) => s.load);
  const create = useGroupStore((s) => s.create);

  const [creating, setCreating] = useState(false);
  const [infoModal, setInfoModal] = useState<null | { message: string }>(null);
  const openInfo = (message: string) => setInfoModal({ message });

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateGroup = async () => {
    if (creating) return;
    const name = form.name.trim();
    if (!name) {
      openInfo("그룹 이름을 입력해주세요.");
      return;
    }
    try {
      setCreating(true);
      const created = await create(name);
      setIsModalOpen(false);
      setForm({ name: "" });
      router.push(
        `/grouptip/group?groupNo=${encodeURIComponent(created.groupNo)}`
      );
    } catch (err) {
      console.error(err);
      openInfo("그룹 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {infoModal && (
        <CommonModal onClose={() => setInfoModal(null)}>
          <div className="min-w-[300px] text-center">
            <h3 className="text-lg font-semibold mb-2">알림</h3>
            <p className="text-sm text-gray-700 mb-4">{infoModal.message}</p>
            <div className="flex justify-end">
              <OkBtn label="확인" onClick={() => setInfoModal(null)} />
            </div>
          </div>
        </CommonModal>
      )}
      {/* 전체 꿀팁 검색: /search?scope=public&q=... */}
      <SearchBar
        placeholder="전체 꿀팁 검색"
        onSearch={(q) => {
          const keyword = (q ?? "").trim();
          if (!keyword) return;
          const params = new URLSearchParams({ scope: "public", q: keyword });
          router.push(`/search?${params.toString()}`);
        }}
      />

      {isModalOpen && (
        <CommonModal>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateGroup();
            }}
          >
            <p className="text-center">그룹의 이름을 입력해주세요</p>
            <LabeledInput
              name="name"
              value={form.name}
              placeholder="그룹 이름을 입력하세요"
              onChange={(e) => setForm({ name: e.target.value })}
            />
            <div className="flex justify-center gap-2 pt-4">
              <OkBtn label="벌집생성하기" onClick={handleCreateGroup} />
              <ModalCancelBtn
                label="취소하기"
                onClose={() => setIsModalOpen(false)}
              />
            </div>
          </form>
        </CommonModal>
      )}

      <main className="relative p-6 pt-0">
        {loading ? (
          <p>불러오는 중...</p>
        ) : groups.length === 0 ? (
          <div className="text-center flex flex-col items-center w-full">
            <p className="mb-4">아직 생성된 그룹이 없습니다.</p>
            <YellowLBtn
              label="그룹 만들기"
              onClick={() => setIsModalOpen(true)}
              className="w-auto px-4"
            />
          </div>
        ) : (
          <div className="grid justify-items-center gap-4 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
            {groups.map((g) => (
              <Link
                key={g.groupNo}
                href={`/grouptip/group?groupNo=${g.groupNo}`}
                className="flex flex-col hover:cursor-pointer"
              >
                <div className="relative mb-3">
                  <Image
                    src="/img/1bee.png"
                    alt="벌꿀"
                    width={40}
                    height={60}
                  />
                </div>
                <div className="text-center">{g.name}</div>
              </Link>
            ))}
            <button
              onClick={() => setIsModalOpen(true)}
              className="col-span-full justify-self-center w-11 h-11 rounded-full bg-[#d9d9d9] text-5xl grid place-items-center hover:cursor-pointer mt-5"
              aria-label="그룹 추가"
            >
              <span className="relative top-[-6px]">+</span>
            </button>
          </div>
        )}
      </main>
    </>
  );
}
