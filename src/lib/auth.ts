/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/useAuthStore";

/* ==================== 상수/설정 ==================== */
// const isMock = process.env.NEXT_PUBLIC_API_MOCK === "true";

/* ==================== 타입 ==================== */

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  userNo: number;
};

type EmptyResponse = void;

/* ==================== API: Auth ==================== */
/** Login (mock: /signup GET 검증, real: POST /api/auth/login) */
export const login = async (
  id: string,
  password: string
): Promise<LoginResponse> => {
  const raw = await apiRequest<LoginResponse>("POST", "/api/auth/login", {
    data: { id, password },
    auth: false,
  });
  return {
    accessToken: raw.accessToken,
    refreshToken: raw.refreshToken,
    userNo: raw.userNo,
  };
};

/* ----- Create (회원가입) ----- */
export const signup = async (
  id: string,
  nickname: string,
  password: string
): Promise<EmptyResponse> => {
  return apiRequest("POST", "/api/auth/signup", {
    data: { id, nickname, password },
    auth: false,
  });
};

/* ----- Action (로그아웃) ----- */
export const logout = async (accessToken: string): Promise<EmptyResponse> => {
  return apiRequest("POST", "/api/auth/logout", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

// 아이디 중복 검사
export const checkIdDuplicate = async (id: string): Promise<boolean> => {
  const res = await apiRequest<boolean>("GET", "/api/auth/check-id", {
    params: { id },
    auth: false,
  });
  return res; // 불린 그대로 반환
};

// 닉네임 중복 검사
export const checkNicknameDuplicate = async (
  nickname: string
): Promise<boolean> => {
  const res = await apiRequest<boolean>("GET", "/api/auth/check-nickname", {
    params: { nickname },
    auth: false,
  });
  return res; // 불린 그대로 반환
};
/* ----- Read (아이디 찾기) ----- */
export const findId = async (nickname: string, password: string) => {
  return apiRequest<string>("POST", "/api/auth/find-id", {
    data: { nickname, password },
    auth: false,
  });
};

/* ----- Update (비밀번호 재설정) ----- */
export const resetPassword = async (
  id: string,
  nickname: string,
  newPassword: string
) => {
  await apiRequest("POST", "/api/auth/reset-pw", {
    data: { id, nickname, newPassword },
    auth: false,
  });
};

/* ----- Delete (회원탈퇴) ----- */
export const withdrawal = async (
  accessToken: string
): Promise<EmptyResponse> => {
  return apiRequest("DELETE", "/api/auth/withdrawal", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

/* ----- Action (로그인 + 스토어 세팅) ----- */
export const loginAndStore = async (
  id: string,
  password: string
): Promise<LoginResponse> => {
  // 1) 로그인
  const res = await login(id, password);

  if (!res?.accessToken || res.userNo == null) {
    useAuthStore.getState().clearAuth();
    throw new Error("로그인 응답이 올바르지 않습니다.");
  }

  // 2) 토큰 저장 (유저 기본정보는 프로필 조회로 세팅)
  const { setTokens, loadUserProfile, clearAuth } = useAuthStore.getState();
  setTokens(res.accessToken, res.refreshToken);

  // 3) 상세 프로필을 스토어에 저장 (실패 시 로그인 상태 정리)
  await loadUserProfile(res.userNo).catch((e) => {
    clearAuth();
    throw e;
  });

  return res;
};

// 로그아웃 + 스토어 정리
export const logoutAndClear = async (accessToken?: string): Promise<void> => {
  const token = accessToken ?? useAuthStore.getState().accessToken ?? undefined;
  if (token) await logout(token);
  useAuthStore.getState().clearAuth();
};
