/* ==================== Imports ==================== */
import { isAxiosError } from "axios";

/* ==================== 타입 ==================== */
// API 에러 응답 공통 형태
export type ApiErrorResponse = {
  status?: number;
  message?: string;
  error?: string;
};

/* ==================== 유틸 함수 ==================== */
// Axios/일반 Error 객체에서 메시지를 추출
export function extractApiErrorMessage(err: unknown): string {
  if (isAxiosError<ApiErrorResponse>(err)) {
    return err.response?.data?.message ?? err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}
