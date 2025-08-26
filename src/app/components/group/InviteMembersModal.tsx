"use client";

import { useState } from "react";
import CommonModal from "@/app/components/modal/CommonModal";
import OkBtn from "@/app/components/common/OkBtn";
import ModalCancelBtn from "@/app/components/modal/ModalCancelBtn";
import { searchUsersById, type UserSearchItem } from "@/lib/search";
import { getUserProfile } from "@/lib/user";
import { inviteGroupMember } from "@/lib/groups";

type Props = {
  groupNo: number;
  onClose: () => void;
  onInvited?: (invitedCount: number) => void; // 완료 후 알림용(optional)
};

export default function InviteMembersModal({
  groupNo,
  onClose,
  onInvited,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [selected, setSelected] = useState<Record<number, UserSearchItem>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    try {
      setLoadingSearch(true);
      setErrorMsg(null);
      const rows = await searchUsersById(q);
      setResults(rows);
    } catch (e) {
      console.error(e);
      setErrorMsg("검색에 실패했습니다.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const toggleSelect = (u: UserSearchItem) => {
    setSelected((s) => {
      const next = { ...s };
      if (next[u.userNo]) delete next[u.userNo];
      else next[u.userNo] = u;
      return next;
    });
  };

  const removeSelected = (userNo: number) => {
    setSelected((s) => {
      const next = { ...s };
      delete next[userNo];
      return next;
    });
  };

  const handleInvite = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const selectedList = Object.values(selected);
      if (selectedList.length === 0) {
        setErrorMsg("초대할 사용자를 선택하세요.");
        return;
      }

      // 선택된 사용자들의 loginId 확보 (프로필에서 loginId 제공)
      const loginIds = await Promise.all(
        selectedList.map(async (u) => {
          const profile = await getUserProfile(u.userNo);
          return profile.loginId as string; // 백엔드 프로필 스키마에 loginId가 있다고 전제
        })
      );

      await inviteGroupMember(groupNo, { userLoginIds: loginIds });

      onInvited?.(loginIds.length);
      onClose();
    } catch (e) {
      console.error(e);
      setErrorMsg("멤버 초대에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CommonModal>
      <div className="min-w-[420px]">
        <h3 className="text-lg font-semibold mb-3 text-center">멤버 초대</h3>

        {/* 검색 입력 */}
        <div className="flex gap-2 mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="아이디 일부/전체로 검색"
            className="flex-1 border border-gray-300 rounded-md px-3 h-10"
          />
          <button
            onClick={runSearch}
            disabled={loadingSearch}
            className="px-4 h-10 rounded-md border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-60"
          >
            {loadingSearch ? "검색중..." : "검색"}
          </button>
        </div>

        {/* 검색 결과 */}
        <div className="max-h-[32vh] overflow-auto border border-gray-200 rounded-md mb-3">
          {results.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              {loadingSearch ? "검색 중..." : "검색 결과가 없습니다."}
            </div>
          ) : (
            <ul className="divide-y">
              {results.map((u) => {
                const active = !!selected[u.userNo];
                return (
                  <li
                    key={u.userNo}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer ${
                      active ? "bg-[var(--color-honey-pale)]" : ""
                    }`}
                    onClick={() => toggleSelect(u)}
                  >
                    <div className="flex items-center gap-3">
                      {/* 썸네일 */}
                      {u.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.profileImageUrl}
                          alt={u.nickname}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                      )}
                      <div>
                        <div className="font-medium">{u.nickname}</div>
                        <div className="text-xs text-gray-500">
                          userNo: {u.userNo}
                        </div>
                      </div>
                    </div>
                    <input type="checkbox" readOnly checked={active} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 선택된 사용자 */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">선택된 사용자</div>
          {Object.keys(selected).length === 0 ? (
            <div className="text-sm text-gray-400">아직 선택되지 않았어요.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.values(selected).map((u) => (
                <span
                  key={u.userNo}
                  className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-gray-100"
                >
                  {u.nickname}
                  <button
                    className="text-gray-400 hover:text-black"
                    onClick={() => removeSelected(u.userNo)}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="text-center text-red-500 text-sm mb-3">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <ModalCancelBtn label="취소" onClose={onClose} />
          <OkBtn
            label={submitting ? "초대 중..." : "초대"}
            onClick={handleInvite}
          />
        </div>
      </div>
    </CommonModal>
  );
}
