import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  getMyGroups,
  createGroup,
  updateGroupName,
  leaveGroup,
  type GroupListItem,
} from "@/lib/groups";

/** 안전한 에러 메시지 추출 헬퍼 */
function errorToMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && typeof e.message === "string" && e.message.trim()) {
    return e.message;
  }
  return fallback;
}

type State = {
  groups: GroupListItem[];
  loading: boolean;
  error: string | null;
};

type Actions = {
  /** 캐시가 있으면 스킵, force=true면 무시하고 다시 로드 */
  load: (force?: boolean) => Promise<void>;
  /** 그룹 생성 후 낙관적으로 목록에 추가(실패 시 롤백) */
  create: (name: string) => Promise<GroupListItem>;
  /** 이름 변경(낙관적 반영, 실패 시 롤백) */
  rename: (groupNo: number, name: string) => Promise<void>;
  /** 삭제(낙관적 반영, 실패 시 롤백) */
  remove: (groupNo: number) => Promise<void>;
  /** 강제 새로고침 */
  refresh: () => Promise<void>;
};

export const useGroupStore = create<State & Actions>()(
  devtools(
    (set, get) => ({
      groups: [],
      loading: false,
      error: null,

      load: async (force = false) => {
        const { groups, loading } = get();
        if (!force && groups.length > 0) return;
        if (loading) return;

        set({ loading: true, error: null });
        try {
          const list = await getMyGroups();
          set({ groups: list, error: null });
        } catch (e: unknown) {
          set({
            error: errorToMessage(e, "그룹 목록을 불러오지 못했습니다."),
          });
        } finally {
          set({ loading: false });
        }
      },

      create: async (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) throw new Error("그룹 이름이 비어 있습니다.");

        // 낙관적 추가를 위한 임시 아이템 (음수 임시 ID)
        const tempId =
          Number.MIN_SAFE_INTEGER + Math.floor(Math.random() * 1000);
        const optimistic: GroupListItem = {
          groupNo: tempId,
          name: trimmed,
          memberCount: 0,
        };

        const prev = get().groups;
        set({ groups: [...prev, optimistic], error: null });

        try {
          const res = await createGroup({ name: trimmed });
          // 임시 ID → 실제 ID로 스왑
          const swapped: GroupListItem = {
            ...optimistic,
            groupNo: res.groupNo,
          };
          set((s) => ({
            groups: s.groups.map((g) => (g.groupNo === tempId ? swapped : g)),
            error: null,
          }));
          return swapped;
        } catch (e: unknown) {
          // 롤백
          set((s) => ({
            groups: s.groups.filter((g) => g.groupNo !== tempId),
            error: errorToMessage(e, "그룹 생성 실패"),
          }));
          throw e;
        }
      },

      rename: async (groupNo: number, name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const prev = get().groups;
        const backup = [...prev];

        // 낙관적 반영
        set({
          groups: prev.map((g) =>
            g.groupNo === groupNo ? { ...g, name: trimmed } : g
          ),
          error: null,
        });

        try {
          await updateGroupName(groupNo, { name: trimmed });
          set({ error: null });
        } catch (e: unknown) {
          // 롤백
          set({ groups: backup, error: errorToMessage(e, "그룹명 변경 실패") });
          throw e;
        }
      },

      remove: async (groupNo: number) => {
        const prev = get().groups;
        const backup = [...prev];

        // 낙관적 제거
        set({
          groups: prev.filter((g) => g.groupNo !== groupNo),
          error: null,
        });

        try {
          await leaveGroup(groupNo);
          set({ error: null });
        } catch (e: unknown) {
          // 롤백
          set({ groups: backup, error: errorToMessage(e, "그룹 나가기 실패") });
          throw e;
        }
      },

      refresh: async () => {
        await get().load(true);
      },
    }),
    { name: "group-store" }
  )
);
