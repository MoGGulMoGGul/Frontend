/* ==================== Imports ==================== */
import axios, {
  AxiosError,
  AxiosRequestConfig,
  Method,
  AxiosHeaders,
} from "axios";
import { authHeader } from "@/lib/authHeader";
import { useAuthStore } from "@/stores/useAuthStore";

/* ==================== 타입/유틸 ==================== */
interface InternalAxiosRequestConfig<D = unknown>
  extends AxiosRequestConfig<D> {
  /** 퍼블릭 엔드포인트: Authorization 자동 부착 금지 */
  __skipAuth?: boolean;
}

type DictHeaders = Record<string, string | number | boolean>;
function ensureAxiosHeaders(h?: AxiosRequestConfig["headers"]): AxiosHeaders {
  if (!h) return new AxiosHeaders();
  if (h instanceof AxiosHeaders) return h;
  if (typeof h === "string") return AxiosHeaders.from(h);
  return AxiosHeaders.from(h as DictHeaders);
}

/* ==================== 인스턴스 ==================== */
// NEXT_PUBLIC_API_BASE_URL 사용 (절대 백엔드 URL)
const baseInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 5000,
});

/* ===== 동일 GET 중복 요청 디듀프 ===== */
const inflight = new Map<string, Promise<unknown>>();
function keyOf(c: AxiosRequestConfig) {
  const m = String(c.method || "").toUpperCase();
  const u = c.url || "";
  const p = c.params ? JSON.stringify(c.params) : "";
  const d = c.data ? JSON.stringify(c.data) : "";
  return `${m}|${u}|${p}|${d}`;
}

/* ==================== 인터셉터 유틸 ==================== */
// 백엔드 실제 인증 경로 기준으로 식별
const isAuthPath = (url?: string) =>
  !!url &&
  (url.includes("/api/auth/login") || url.includes("/api/auth/refresh"));
let refreshInFlight: Promise<void> | null = null;

/* ==================== Request 인터셉터 ==================== */
baseInstance.interceptors.request.use((config) => {
  config.headers = ensureAxiosHeaders(config.headers);
  const h = config.headers as AxiosHeaders;

  if (config.method?.toLowerCase() === "get") {
    h.set("Cache-Control", "no-cache");
    h.set("Pragma", "no-cache");
  }

  const skipAuth = (config as InternalAxiosRequestConfig).__skipAuth === true;
  if (!skipAuth && !isAuthPath(config.url) && !h.has("Authorization")) {
    const token = useAuthStore.getState().accessToken;
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

/* ==================== Response 인터셉터 ==================== */
baseInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const { response, config } = error || {};
    if (!response || !config) throw error;
    if (response.status !== 401 || isAuthPath(config.url)) throw error;

    const orig = config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (orig._retry) throw error;

    const store = useAuthStore.getState();

    try {
      if (!refreshInFlight) {
        refreshInFlight = store.refreshTokens().finally(() => {
          refreshInFlight = null;
        });
      }
      await refreshInFlight;

      orig._retry = true;
      orig.headers = ensureAxiosHeaders(orig.headers);
      (orig.headers as AxiosHeaders).set(
        "Authorization",
        `Bearer ${useAuthStore.getState().accessToken ?? ""}`
      );

      return baseInstance(orig);
    } catch (e) {
      store.clearAuth?.();
      throw e;
    }
  }
);

/* ==================== 공개 옵션 타입 ==================== */
type ApiOptions = {
  data?: unknown;
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** 기본값 true: 보호 API. false면 퍼블릭(토큰 자동부착/검사 안함) */
  auth?: boolean;
};

/* ==================== 공용 호출 함수 ==================== */
export const apiRequest = async <T = unknown>(
  method: Method,
  url: string, // <-- 여기엔 '/auth/login' 같은 백엔드 실제 경로를 넣으세요 (프론트의 /api/* 아님)
  options?: ApiOptions
): Promise<T> => {
  const cleanedParams =
    options?.params &&
    Object.fromEntries(
      Object.entries(options.params).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      )
    );

  const mergedHeaders: Record<string, string> = {
    ...(options?.headers || {}),
  };

  if (options?.auth !== false) {
    Object.assign(mergedHeaders, authHeader());
  }

  const hasContentType = Object.keys(mergedHeaders).some(
    (k) => k.toLowerCase() === "content-type"
  );
  const isFormData =
    typeof FormData !== "undefined" && options?.data instanceof FormData;
  if (options?.data !== undefined && !hasContentType && !isFormData) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  const config: InternalAxiosRequestConfig = {
    method,
    url,
    data: options?.data,
    params: cleanedParams,
    headers: mergedHeaders,
    signal: options?.signal,
    __skipAuth: options?.auth === false,
  };

  const isGet = String(method).toUpperCase() === "GET";
  const k = isGet ? keyOf(config) : "";

  if (isGet && inflight.has(k)) {
    return inflight.get(k) as Promise<T>;
  }

  const req = baseInstance(config)
    .then((r) => r.data as T)
    .finally(() => {
      if (isGet) inflight.delete(k);
    });

  if (isGet) inflight.set(k, req);

  return req;
};
