/* ==================== Imports ==================== */
import { useAuthStore } from "@/stores/useAuthStore";

/* ==================== 유틸 함수 ==================== */
// Authorization 헤더 생성
export const authHeader = () => {
  const token = useAuthStore.getState().accessToken;

  if (!token) {
    throw new Error("액세스 토큰이 없습니다. 로그인 후 다시 시도해 주세요.");
  }
  return { Authorization: `Bearer ${token}` };
};
