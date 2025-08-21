import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  getUserStorageList,
  createStorage,
  updateStorageName,
  deleteStorage,
  type UserStorageItem,
} from "@/lib/storage";
import { useAuthStore } from "@/stores/useAuthStore";

function errorToMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message.trim()) return e.message;
  return fallback;
}

type State = {
  storages: UserStorageItem[];
  loading: boolean;
  error: string | null;
  ownerUserNo: number | null;
};

type Actions = {
  load: (userNo: number, force?: boolean) => Promise<void>;
  add: (name: string) => Promise<UserStorageItem>;
  rename: (storageNo: number, name: string) => Promise<void>;
  remove: (storageNo: number) => Promise<void>;
  refresh: () => Promise<void>;
};

export const useUserStorageStore = create<State & Actions>()(
  devtools(
    (set, get) => ({
      storages: [],
      loading: false,
      error: null,
      ownerUserNo: null,

      load: async (userNo: number, force = false) => {
        const { loading, ownerUserNo, storages } = get();
        if (!force && ownerUserNo === userNo && storages.length > 0) return;
        if (loading) return;

        set({ loading: true, error: null, ownerUserNo: userNo });
        try {
          const list = await getUserStorageList(userNo);
          set({ storages: list, error: null });
        } catch (e: unknown) {
          set({
            error: errorToMessage(e, "내 보관함 목록을 불러오지 못했습니다."),
          });
        } finally {
          set({ loading: false });
        }
      },

      add: async (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) throw new Error("보관함 이름이 비어 있습니다.");

        const tempId =
          Number.MIN_SAFE_INTEGER + Math.floor(Math.random() * 1000);
        const optimistic: UserStorageItem = {
          storageNo: tempId,
          name: trimmed,
        };

        const prev = get().storages;
        set({ storages: [...prev, optimistic], error: null });

        try {
          const res = await createStorage({ name: trimmed, groupNo: null });

          // 임시 ID → 실제 ID
          set((s) => ({
            storages: s.storages.map((st) =>
              st.storageNo === tempId ? { ...st, storageNo: res.storageNo } : st
            ),
            error: null,
          }));

          // 생성 직후 서버와 동기화 (userNo가 있으면)
          const authUserNo = useAuthStore.getState().userNo;
          if (authUserNo != null) {
            set({ ownerUserNo: authUserNo });
            await get().load(authUserNo, true);
          }

          return { ...optimistic, storageNo: res.storageNo };
        } catch (e: unknown) {
          set((s) => ({
            storages: s.storages.filter((st) => st.storageNo !== tempId),
            error: errorToMessage(e, "보관함 생성 실패"),
          }));
          throw e;
        }
      },

      rename: async (storageNo: number, name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const prev = get().storages;
        const backup = [...prev];

        set({
          storages: prev.map((st) =>
            st.storageNo === storageNo ? { ...st, name: trimmed } : st
          ),
          error: null,
        });

        try {
          await updateStorageName(storageNo, trimmed);
          set({ error: null });
        } catch (e: unknown) {
          set({ storages: backup, error: errorToMessage(e, "이름 변경 실패") });
          throw e;
        }
      },

      remove: async (storageNo: number) => {
        const prev = get().storages;
        const backup = [...prev];

        set({
          storages: prev.filter((st) => st.storageNo !== storageNo),
          error: null,
        });

        try {
          await deleteStorage(storageNo);
          set({ error: null });
          // 삭제 후에도 서버와 즉시 동기화
          const u = get().ownerUserNo;
          if (u != null) await get().load(u, true);
        } catch (e: unknown) {
          set({ storages: backup, error: errorToMessage(e, "삭제 실패") });
          throw e;
        }
      },

      refresh: async () => {
        const userNo =
          get().ownerUserNo ?? useAuthStore.getState().userNo ?? null;
        if (userNo == null) return;
        await get().load(userNo, true);
      },
    }),
    { name: "user-storage-store" }
  )
);
