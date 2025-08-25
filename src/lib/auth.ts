/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/useAuthStore";

/* ==================== 상수/설정 ==================== */
const isMock = process.env.NEXT_PUBLIC_API_MOCK === "false";

/* ==================== 타입 ==================== */
// 공개 응답 타입
type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  login: string;
  nickname: string;
  userNo: number;
};

type EmptyResponse = void;

type RealLoginResponse = {
  accessToken: string;
  refreshToken: string;
  login: string;
  nickname: string;
  userNo: number;
};

/* ==================== 내부(raw) 타입 ==================== */
// mock 서버 응답 형태 (json-server /signup)
type MockRow = {
  id: string;
  password: string;
  nickname?: string;
  userNo?: number;
  no?: number;
};

/* ==================== API: Auth ==================== */
/** Login (mock: /signup GET 검증, real: POST /api/auth/login) */
export const login = async (
  id: string,
  password: string
): Promise<LoginResponse> => {
  if (isMock) {
    const rows = await apiRequest<MockRow[]>("GET", "/signup", {
      params: { id, password },
    });
    if (!rows.length) {
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
    const u = rows[0];
    const userNo = u.userNo ?? u.no!;
    return {
      accessToken: `mock-access-${userNo}`,
      refreshToken: `mock-refresh-${userNo}`,
      login: u.id,
      nickname: u.nickname ?? "사용자",
      userNo,
    };
  }

  const raw = await apiRequest<RealLoginResponse>("POST", "/api/auth/login", {
    data: { id, password },
  });
  return {
    accessToken: raw.accessToken,
    refreshToken: raw.refreshToken,
    login: raw.login,
    nickname: raw.nickname,
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

/* ----- Read (중복 검사: mock) ----- */
// 아이디 중복 검사 (mock)
// export const checkIdDuplicateMock = async (id: string): Promise<boolean> => {
//   const response = await apiRequest<{ id: string }[]>("GET", "/signup", {
//     params: { id },
//   });
//   return response.length > 0; // true = 중복
// };

// 닉네임 중복 검사 (mock)
// export const checkNicknameDuplicateMock = async (
//   nickname: string
// ): Promise<boolean> => {
//   const response = await apiRequest<{ nickname: string }[]>("GET", "/signup", {
//     params: { nickname },
//   });
//   return response.length > 0;
// };

// 아이디 중복 검사
export const checkIdDuplicate = async (id: string): Promise<boolean> => {
  const res = await apiRequest<{ exists: boolean }>(
    "GET",
    "/api/auth/check-id",
    {
      params: { id },
    }
  );
  return res.exists;
};

// 닉네임 중복 검사 (real)
export const checkNicknameDuplicate = async (
  nickname: string
): Promise<boolean> => {
  const res = await apiRequest<{ exists: boolean }>(
    "GET",
    "/api/auth/check-nickname",
    { params: { nickname } }
  );
  return res.exists;
};

/* ----- Read (아이디 찾기) ----- */
export const findId = async (nickname: string, password: string) => {
  return apiRequest<string>("POST", "/api/auth/find-id", {
    data: { nickname, password },
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
// 로그인 + 토큰/기본정보 저장 + 프로필 즉시 로드(스토어에 저장)
export const loginAndStore = async (
  id: string,
  password: string
): Promise<LoginResponse> => {
  // 1) 로그인
  const res = await login(id, password);

  // 2) 토큰/기본 유저정보 저장
  const { setTokens, setUser, loadUserProfile } = useAuthStore.getState();
  setTokens(res.accessToken, res.refreshToken);
  setUser({ login: res.login, nickname: res.nickname, userNo: res.userNo });

  // 3) 상세 프로필을 스토어에 저장 (여기서 followerCount/followingCount가 채워짐)
  try {
    await loadUserProfile(res.userNo);
  } catch (e) {
    console.warn("[loginAndStore] 프로필 로드 실패(무시 가능):", e);
  }

  return res;
};

// 로그아웃 + 스토어 정리
export const logoutAndClear = async (accessToken?: string): Promise<void> => {
  const token = accessToken ?? useAuthStore.getState().accessToken ?? undefined;
  if (token) {
    await logout(token);
  }
  useAuthStore.getState().clearAuth();
};
