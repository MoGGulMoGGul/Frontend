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
// 내부적으로만 쓰는 확장 컨피그(퍼블릭 요청 표시용)
interface InternalAxiosRequestConfig<D = unknown>
  extends AxiosRequestConfig<D> {
  /** 퍼블릭 엔드포인트: Authorization 자동 부착 금지 */
  __skipAuth?: boolean;
}

/** POJO 헤더를 AxiosHeaders로 변환 (RawAxiosHeaders 미사용) */
type DictHeaders = Record<string, string | number | boolean>;
function ensureAxiosHeaders(h?: AxiosRequestConfig["headers"]): AxiosHeaders {
  if (!h) return new AxiosHeaders();
  if (h instanceof AxiosHeaders) return h;
  if (typeof h === "string") return AxiosHeaders.from(h); // 드물지만 지원
  return AxiosHeaders.from(h as DictHeaders);
}

/* ==================== 인스턴스 ==================== */
const baseInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  timeout: 5000,
});

/* ===== (추가) 동일 GET 중복 요청 디듀프 ===== */
const inflight = new Map<string, Promise<unknown>>();
function keyOf(c: AxiosRequestConfig) {
  const m = String(c.method || "").toUpperCase();
  const u = c.url || "";
  const p = c.params ? JSON.stringify(c.params) : "";
  const d = c.data ? JSON.stringify(c.data) : "";
  return `${m}|${u}|${p}|${d}`;
}

/* ==================== 인터셉터 유틸 ==================== */
const isAuthPath = (url?: string) =>
  !!url &&
  (url.includes("/api/auth/login") || url.includes("/api/auth/refresh"));

let refreshInFlight: Promise<void> | null = null;

/* ==================== Request 인터셉터 ==================== */
baseInstance.interceptors.request.use((config) => {
  // 헤더를 항상 AxiosHeaders로
  config.headers = ensureAxiosHeaders(config.headers);
  const h = config.headers as AxiosHeaders;

  // GET 캐시 무효화
  if (config.method?.toLowerCase() === "get") {
    h.set("Cache-Control", "no-cache");
    h.set("Pragma", "no-cache");
  }

  // Authorization 자동 부착 (퍼블릭 요청은 제외)
  const skipAuth = (config as InternalAxiosRequestConfig).__skipAuth === true;
  if (!skipAuth && !isAuthPath(config.url) && !h.has("Authorization")) {
    const token = useAuthStore.getState().accessToken;
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

/* ==================== Response 인터셉터 ==================== */
// 401 → refreshTokens 실행 → 원 요청 1회 재시도
baseInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const { response, config } = error || {};
    if (!response || !config) throw error;
    if (response.status !== 401 || isAuthPath(config.url)) throw error;

    const orig = config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (orig._retry) throw error; // 루프 방지

    const store = useAuthStore.getState();

    try {
      if (!refreshInFlight) {
        refreshInFlight = store.refreshTokens().finally(() => {
          refreshInFlight = null;
        });
      }
      await refreshInFlight;

      // 최신 액세스 토큰으로 재시도
      orig._retry = true;
      orig.headers = ensureAxiosHeaders(orig.headers);
      (orig.headers as AxiosHeaders).set(
        "Authorization",
        `Bearer ${useAuthStore.getState().accessToken ?? ""}`
      );

      return baseInstance(orig);
    } catch (e) {
      // 리프레시 실패 → 완전 로그아웃
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
  url: string,
  options?: ApiOptions
): Promise<T> => {
  // params에서 null/undefined/빈문자 제거
  const cleanedParams =
    options?.params &&
    Object.fromEntries(
      Object.entries(options.params).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      )
    );

  // 호출자가 명시한 헤더(문자열 레코드)만 우선 병합
  const mergedHeaders: Record<string, string> = {
    ...(options?.headers || {}),
  };

  // 보호 API면 authHeader()도 병합(Authorization 등)
  if (options?.auth !== false) {
    Object.assign(mergedHeaders, authHeader());
  }

  // JSON body면 Content-Type 기본값 (FormData는 자동)
  const hasContentType = Object.keys(mergedHeaders).some(
    (k) => k.toLowerCase() === "content-type"
  );
  const isFormData =
    typeof FormData !== "undefined" && options?.data instanceof FormData;
  if (options?.data !== undefined && !hasContentType && !isFormData) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  // 퍼블릭 호출이면 인터셉터에서 토큰 자동부착을 건너뛰게 플래그 설정
  const config: InternalAxiosRequestConfig = {
    method,
    url,
    data: options?.data,
    params: cleanedParams,
    headers: mergedHeaders, // POJO → 인터셉터에서 AxiosHeaders로 통일
    signal: options?.signal,
    __skipAuth: options?.auth === false,
  };

  /* ===== (추가) 동일 GET 중복 요청 디듀프 ===== */
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
