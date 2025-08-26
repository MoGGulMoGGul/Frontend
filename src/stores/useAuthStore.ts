import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
// API 호출에 쓸 타입/함수 임포트
import { getUserProfile, type UserProfile as ApiUserProfile } from "@/lib/user";
import { apiRequest } from "@/lib/apiClient";

type UserProfile = {
  login: string;
  nickname: string;
  userNo: number;
};

type AuthState = {
  accessToken: string | null; // 메모리 전용
  refreshToken: string | null; // 로컬스토리지 저장

  // 기존 사용자 식별 필드
  login: string | null; // 로컬스토리지 저장
  nickname: string | null; // 로컬스토리지 저장
  userNo: number | null; // 로컬스토리지 저장

  // 상세 프로필(로컬스토리지 저장)
  profileImageUrl: string | null;
  followerCount: number | null;
  followingCount: number | null;
  totalBookmarkCount: number | null;

  setTokens: (access: string, refresh: string) => void;
  setUser: (p: UserProfile) => void;
  clearAuth: () => void;

  //  로그인 직후 userNo로 프로필 불러와 저장
  loadUserProfile: (userNo: number) => Promise<void>;

  refreshTokens: () => Promise<void>;

  // 신규: 카운트 관련 액션
  updateCounts: (
    p: Partial<
      Pick<AuthState, "followerCount" | "followingCount" | "totalBookmarkCount">
    >
  ) => void;
  incFollowing: (delta: number) => void;
  incFollower: (delta: number) => void;
  setCountsFromProfile: (p: ApiUserProfile) => void;

  // 하이드레이션 플래그
  _hasHydrated: boolean;
  _setHasHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,

      login: null,
      nickname: null,
      userNo: null,

      profileImageUrl: null,
      followerCount: null,
      followingCount: null,
      totalBookmarkCount: null,

      setTokens: (access, refresh) => {
        console.log("[useAuthStore] setTokens", { access, refresh });
        set({ accessToken: access, refreshToken: refresh });
      },

      setUser: (p) => {
        console.log("[useAuthStore] setUser", p);
        set({ login: p.login, nickname: p.nickname, userNo: p.userNo });
      },

      clearAuth: () => {
        console.log("[useAuthStore] clearAuth");
        set({
          accessToken: null,
          refreshToken: null,
          login: null,
          nickname: null,
          userNo: null,
          profileImageUrl: null,
          followerCount: null,
          followingCount: null,
          totalBookmarkCount: null,
        });
      },

      /* 리프레시 토큰으로 액세스 토큰 재발급 */
      refreshTokens: async () => {
        const rt = get().refreshToken;
        if (!rt) throw new Error("리프레시 토큰이 없습니다.");
        const res = await apiRequest<{
          accessToken: string;
          refreshToken?: string;
        }>("POST", "/api/auth/refresh", {
          auth: false, // access 자동부착 금지
          headers: { Authorization: `Bearer ${rt}` },
        });

        // 새 토큰들 반영 (서버가 새 refreshToken을 돌려주니 꼭 교체)
        set({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken ?? rt,
        });
      },

      // 프로필 즉시 로드 & 저장
      loadUserProfile: async (userNo: number) => {
        const data: ApiUserProfile = await getUserProfile(userNo);
        set({
          // 식별 필드 최신화 (loginId -> login)
          login: data.loginId,
          nickname: data.nickname,
          userNo: data.userNo,

          // 상세 프로필 저장
          profileImageUrl: data.profileImageUrl ?? null,
          followerCount: data.followerCount ?? 0,
          followingCount: data.followingCount ?? 0,
          totalBookmarkCount: data.totalBookmarkCount ?? 0,
        });
      },

      // ─────────────────────────────────────────────
      // 카운트/프로필 숫자 전역 관리 액션 (추가)
      updateCounts: (p) => {
        set((s) => ({
          followerCount: p.followerCount ?? s.followerCount ?? 0,
          followingCount: p.followingCount ?? s.followingCount ?? 0,
          totalBookmarkCount: p.totalBookmarkCount ?? s.totalBookmarkCount ?? 0,
        }));
      },

      // 내가 팔로우하는 수 증감 (팔로우/언팔로우 시 즉시 반영)
      incFollowing: (delta) => {
        set((s) => ({
          followingCount: Math.max(0, (s.followingCount ?? 0) + delta),
        }));
      },

      // 나를 팔로우하는 수 증감 (웹소켓/알림 등 들어올 때 사용)
      incFollower: (delta) => {
        set((s) => ({
          followerCount: Math.max(0, (s.followerCount ?? 0) + delta),
        }));
      },

      // 서버 프로필 응답으로 스토어 숫자 세팅
      setCountsFromProfile: (p) => {
        set({
          followerCount: p.followerCount ?? 0,
          followingCount: p.followingCount ?? 0,
          totalBookmarkCount: p.totalBookmarkCount ?? 0,
        });
      },
      // ─────────────────────────────────────────────

      // 하이드레이션 플래그 기본값/세터
      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "local-storage",

      // Next.js에서도 안전: 브라우저에서만 실행
      storage: createJSONStorage(() => localStorage),

      // 로컬스토리지에는 refreshToken + 유저정보 + 상세프로필만 저장
      // (accessToken은 메모리 전용)
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        login: state.login,
        nickname: state.nickname,
        userNo: state.userNo,
        profileImageUrl: state.profileImageUrl,
        followerCount: state.followerCount,
        followingCount: state.followingCount,
        totalBookmarkCount: state.totalBookmarkCount,
      }),

      version: 1,

      onRehydrateStorage: () => {
        console.log("[useAuthStore] rehydrating...");
        return (state, error) => {
          if (error) {
            console.error("[useAuthStore] rehydrate error", error);
          } else {
            // 복원 완료 신호
            state?._setHasHydrated(true);
            console.log("[useAuthStore] rehydrated state", state);
          }
        };
      },
    }
  )
);
