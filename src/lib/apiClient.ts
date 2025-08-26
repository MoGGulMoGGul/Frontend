/* ==================== Imports ==================== */
import axios, { AxiosRequestConfig, Method } from "axios";
import { authHeader } from "@/lib/authHeader";

/* ==================== 상수/설정 ==================== */
const baseInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  timeout: 5000,
});

// 브라우저 캐시/304 회피 (GET)
baseInstance.defaults.headers.get = baseInstance.defaults.headers.get || {};
baseInstance.defaults.headers.get["Cache-Control"] = "no-cache";
baseInstance.defaults.headers.get["Pragma"] = "no-cache";

/* ==================== 타입 ==================== */
type ApiOptions = {
  data?: unknown;
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  auth?: boolean;
};

/* ==================== API 함수 ==================== */
export const apiRequest = async <T = unknown>(
  method: Method,
  url: string,
  options?: ApiOptions
): Promise<T> => {
  // params에서 null/undefined/빈문자 제거 (json-server 필터 오염 방지)
  const cleanedParams =
    options?.params &&
    Object.fromEntries(
      Object.entries(options.params).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      )
    );

  const mergedHeaders: Record<string, string> = { ...(options?.headers || {}) };

  if (options?.auth !== false) {
    // 보호 API: 토큰이 없으면 예외를 그대로 던져서 조기에 차단
    Object.assign(mergedHeaders, authHeader());
  }

  const hasContentType = Object.keys(mergedHeaders).some(
    (k) => k.toLowerCase() === "content-type"
  );

  // FormData면 Content-Type을 절대 수동 지정하지 않음 (브라우저/axios가 boundary 포함해서 자동 설정)
  const isFormData =
    typeof FormData !== "undefined" && options?.data instanceof FormData;

  // JSON body일 때만 기본 Content-Type 지정
  if (options?.data !== undefined && !hasContentType && !isFormData) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  const config: AxiosRequestConfig = {
    method,
    url,
    data: options?.data,
    params: cleanedParams,
    headers: mergedHeaders,
    signal: options?.signal,
  };

  const response = await baseInstance(config);
  return response.data as T;
};
