/* ==================== Imports ==================== */
import { useAuthStore } from "@/stores/useAuthStore";

/* ==================== 유틸 함수 ==================== */
// Authorization 헤더 생성
export const authHeader = () => {
  const token = useAuthStore.getState().accessToken;

  if (!token) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ 개발 모드: accessToken 없음 → mock-token 사용");
      return { Authorization: "Bearer mock-token" };
    }
    throw new Error("로그인이 필요합니다.");
  }

  return { Authorization: `Bearer ${token}` };
};
