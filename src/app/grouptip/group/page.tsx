"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CommonModal from "../../components/modal/CommonModal";
import OkBtn from "../../components/common/OkBtn";
import ModalCancelBtn from "../../components/modal/ModalCancelBtn";
import LabeledInput from "../../components/form/LabeledInput";

import {
  getStoragesByGroup,
  createStorage,
  GroupStorageItem,
} from "@/lib/storage";

import {
  getMyGroups,
  getGroupMembers,
  leaveGroup,
  GroupListItem,
  GroupMember,
} from "@/lib/groups";

import SearchBar from "@/app/components/common/SearchBar";

// 스토어/하이드레이션 사용
import { useGroupStore } from "@/stores/useGroupStorageStore";
import { useAuthStore } from "@/stores/useAuthStore";
import InviteMembersModal from "@/app/components/group/InviteMembersModal";

export default function GrouptipGroupPage() {
  const router = useRouter();

  // 쿼리 파라미터는 마운트 후 한 번만 읽어온다.
  const [groupNo, setGroupNo] = useState<number | null>(null); // null = 아직 판단 전
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = Number(params.get("groupNo") ?? NaN);
    setGroupNo(Number.isFinite(v) ? v : NaN);
  }, []);

  // 🔧 최소수정: 히스토리 패치 대신 폴링으로 검색어 변경 감지 (Next 라우터와 충돌 없음)
  useEffect(() => {
    let last = window.location.search;
    const tick = () => {
      const cur = window.location.search;
      if (cur !== last) {
        last = cur;
        const p = new URLSearchParams(cur);
        const v = Number(p.get("groupNo") ?? NaN);
        setGroupNo(Number.isFinite(v) ? v : NaN);
      }
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, []);

  const isPending = groupNo === null;
  const isValidParams = typeof groupNo === "number" && Number.isFinite(groupNo);

  // 토큰/스토어 하이드레이션 대기
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // 보관함 생성 모달
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "" });

  // 헤더 상태
  const [groupName, setGroupName] = useState<string>("");
  const [headerLoading, setHeaderLoading] = useState(true);

  // 멤버 관련 상태
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // 초대 관련 상태
  const [showInvite, setShowInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  // 그룹 나가기
  const [showLeave, setShowLeave] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  // 보관함 목록
  const [storages, setStorages] = useState<GroupStorageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 그룹이 바뀌면 로딩 플래그 리셋
  useEffect(() => {
    if (groupNo !== null) {
      setHeaderLoading(true);
      setLoading(true);
    }
  }, [groupNo]);

  /* ---- 헤더 로딩 (그룹명) ---- */
  useEffect(() => {
    let alive = true;

    // 하이드레이션/쿼리 파싱 완료 전에는 스킵
    if (!hasHydrated || groupNo === null) return;

    (async () => {
      try {
        if (!isValidParams) {
          if (alive) {
            setGroupName("");
            setHeaderLoading(false);
          }
          return;
        }

        // 스토어 캐시 우선 사용
        const store1 = useGroupStore.getState();
        const cached = store1.groups.find((g) => g.groupNo === groupNo);
        if (cached) {
          if (!alive) return;
          setGroupName(cached.name);
          setHeaderLoading(false);
          return;
        }

        // 스토어 강제 로드 후 재확인
        await store1.load(true);
        if (!alive) return;
        const store2 = useGroupStore.getState();
        const fromStore = store2.groups.find((g) => g.groupNo === groupNo);
        if (fromStore) {
          setGroupName(fromStore.name);
          setHeaderLoading(false);
          return;
        }

        // 최후 수단: 직접 API 호출
        const list: GroupListItem[] = await getMyGroups();
        if (!alive) return;
        const found = list.find((g) => g.groupNo === groupNo);
        setGroupName(found?.name ?? `그룹 #${groupNo}`);
      } catch (e) {
        console.error("그룹 정보 조회 실패:", e);
        if (!alive) return;
        setGroupName(`그룹 #${groupNo}`);
      } finally {
        if (!alive) return;
        setHeaderLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [groupNo, isValidParams, hasHydrated]);

  /* ---- 보관함 목록 로딩 ---- */
  useEffect(() => {
    let alive = true;

    // 하이드레이션/쿼리 파싱 완료 전에는 스킵
    if (!hasHydrated || groupNo === null) return;

    (async () => {
      try {
        if (!isValidParams) {
          if (alive) {
            setStorages([]);
            setLoading(false);
          }
          return;
        }
        const list = await getStoragesByGroup(groupNo);
        if (!alive) return;
        setStorages(list);
      } catch (e) {
        console.error("보관함 목록 조회 실패:", e);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [groupNo, isValidParams, hasHydrated]);

  /* ---- 보관함 생성 ---- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateStorage = async () => {
    const name = form.name.trim();
    if (!name) {
      setInviteResult("보관함 이름을 입력해주세요.");
      return;
    }
    try {
      const res = await createStorage({ name, groupNo: groupNo! });
      setIsModalOpen(false);
      setForm({ name: "" });
      router.push(
        `/grouptip/storage?groupNo=${groupNo!}&storageNo=${res.storageNo}`
      );
    } catch (e) {
      console.error(e);
      setInviteResult("보관함 생성에 실패했습니다.");
    }
  };

  /* ---- 멤버 조회 ---- */
  const openMembers = async () => {
    try {
      setMembersLoading(true);
      setShowMembers(true);
      const list = await getGroupMembers(groupNo!);
      setMembers(list);
    } catch (e) {
      console.error("멤버 조회 실패:", e);
      setShowMembers(false);
      setInviteResult("멤버 조회에 실패했습니다.");
    } finally {
      setMembersLoading(false);
    }
  };

  /* ---- 그룹 나가기 ---- */
  const handleLeaveGroup = async () => {
    try {
      setLeaveLoading(true);
      await leaveGroup(groupNo!);
      setShowLeave(false);
      router.push("/grouptip");
    } catch (e) {
      console.error("그룹 나가기 실패:", e);
      setInviteResult("그룹 나가기에 실패했습니다.");
    } finally {
      setLeaveLoading(false);
    }
  };

  /* ---- 렌더 ---- */
  return (
    <>
      {/* 이 그룹에서 꿀팁 검색 → /search?scope=group&groupId={groupNo}&q=... */}
      <SearchBar
        placeholder="이 그룹에서 꿀팁 검색"
        onSearch={(q) => {
          if (!isValidParams) return;
          const keyword = (q ?? "").trim();
          if (!keyword) return;
          const params = new URLSearchParams({
            scope: "group",
            groupId: String(groupNo!),
            q: keyword,
          });
          router.push(`/search?${params.toString()}`);
        }}
      />

      <div className="relative p-6 pt-0">
        {isPending ? (
          <main className="p-4">불러오는 중...</main>
        ) : !isValidParams ? (
          <main className="p-4">잘못된 경로입니다.</main>
        ) : (
          <>
            {/* 헤더 */}
            <div className="w-full bg-[rgba(249,217,118,0.52)] rounded-3xl py-5 px-8 mb-10 relative">
              {headerLoading ? (
                <div>불러오는 중...</div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold truncate">
                    {groupName}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openMembers}
                      className="w-24 h-10 rounded-xl border border-[var(--color-honey-pale)] bg-white hover:bg-[var(--color-honey-pale)]"
                    >
                      멤버 조회
                    </button>
                    <button
                      onClick={() => setShowInvite(true)}
                      className="w-24 h-10 rounded-xl border border-[var(--color-honey-pale)] bg-white hover:bg-[var(--color-honey-pale)]"
                    >
                      멤버 초대
                    </button>
                    <button
                      onClick={() => setShowLeave(true)}
                      className="w-24 h-10 rounded-xl border border-[var(--color-honey-pale)] bg-white hover:bg-[var(--color-honey-pale)]"
                    >
                      그룹 나가기
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 본문: 보관함 목록 */}
            <main className="relative">
              {loading ? (
                <p>불러오는 중...</p>
              ) : storages.length === 0 ? (
                <div className="text-center flex flex-col items-center w-full">
                  <p className="mb-4">이 그룹에는 아직 보관함이 없습니다.</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 h-10 rounded-md bg-[var(--color-honey-light)] hover:opacity-90"
                  >
                    보관함 만들기
                  </button>
                </div>
              ) : (
                <div className="grid justify-items-center gap-4 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
                  {storages.map((s) => (
                    <Link
                      key={s.storageNo}
                      href={`/grouptip/storage?groupNo=${groupNo!}&storageNo=${
                        s.storageNo
                      }`}
                      className="flex flex-col items-center hover:cursor-pointer"
                    >
                      <div className="relative mb-3">
                        <Image
                          src="/img/벌집.png"
                          alt="벌꿀"
                          width={115}
                          height={129}
                        />
                        <Image
                          src="/img/1bee.png"
                          alt="벌"
                          width={23}
                          height={24}
                          className="absolute bottom-[16px] left-[80px]"
                        />
                      </div>
                      <div className="text-center">{s.name}</div>
                    </Link>
                  ))}

                  {/* (+) 버튼을 같은 그리드에 포함 */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="col-span-full justify-self-center w-11 h-11 rounded-full bg-[#d9d9d9] text-5xl grid place-items-center hover:cursor-pointer mt-5"
                    aria-label="보관함 추가"
                  >
                    <span className="relative top-[-6px]">+</span>
                  </button>
                </div>
              )}
            </main>
          </>
        )}

        {/* 보관함 생성 모달 */}
        {isModalOpen && (
          <CommonModal>
            <p className="text-center mb-3">보관함 이름을 입력해주세요</p>
            <LabeledInput
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="보관함 이름을 입력하세요"
            />
            <div className="flex justify-center gap-2 pt-4">
              <OkBtn label="보관함 생성하기" onClick={handleCreateStorage} />
              <ModalCancelBtn
                label="취소하기"
                onClose={() => setIsModalOpen(false)}
              />
            </div>
          </CommonModal>
        )}

        {/* 멤버 조회/초대/나가기 모달 */}
        {showMembers && (
          <CommonModal>
            <div className="min-w-[320px] max-w-[640px] mx-auto">
              <h3 className="text-lg font-semibold mb-3 text-center">
                멤버 목록
              </h3>

              {membersLoading ? (
                <div>불러오는 중...</div>
              ) : members.length === 0 ? (
                <div className="text-center text-gray-500">
                  멤버가 없습니다.
                </div>
              ) : (
                <div className="max-h-[40vh] overflow-auto mb-3">
                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => (
                      <span
                        key={m.userNo}
                        className="inline-flex items-center px-3 h-8 rounded-full bg-gray-100 text-sm"
                        title={m.nickname}
                      >
                        <span className="font-medium truncate max-w-[240px]">
                          {m.nickname}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <OkBtn label="닫기" onClick={() => setShowMembers(false)} />
              </div>
            </div>
          </CommonModal>
        )}

        {showInvite && (
          <InviteMembersModal
            groupNo={groupNo!}
            onClose={() => setShowInvite(false)}
            onInvited={(n) => {
              setInviteResult(`초대 완료: ${n}명`);
              setShowInvite(false);
            }}
          />
        )}

        {inviteResult && (
          <CommonModal>
            <div className="text-center flex flex-col items-center">
              <p className="mb-4 whitespace-pre-line">{inviteResult}</p>
              <OkBtn label="닫기" onClick={() => setInviteResult(null)} />
            </div>
          </CommonModal>
        )}

        {showLeave && (
          <CommonModal>
            <div className="min-w-[320px] text-center">
              <h3 className="text-lg font-semibold mb-2">그룹 나가기</h3>
              <p className="text-sm text-gray-600 mb-4">
                이 그룹에서 나가시겠어요?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowLeave(false)}
                  className="px-4 h-10 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  onClick={handleLeaveGroup}
                  disabled={leaveLoading}
                  className="px-4 h-10 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-60"
                >
                  나가기
                </button>
              </div>
            </div>
          </CommonModal>
        )}
      </div>
    </>
  );
}
