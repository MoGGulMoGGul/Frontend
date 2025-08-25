/* ==================== 유틸 함수 ==================== */
const isEmpty = (v?: string | null) => !v || !v.trim(); // 빈 문자열/공백/null 처리
const isDataUrl = (s: string) => s.startsWith("data:"); // data URL 여부
const isRemote = (s: string) =>
  s.startsWith("http://") || s.startsWith("https://"); // 원격 URL 여부
const toPublicPath = (s: string) => (s.startsWith("/") ? s : `/${s}`); // /public 기준 경로 보정

/* ==================== 이미지 경로 해석 ==================== */
// 로컬 썸네일 경로를 안전하게 변환 (data:, http(s):는 그대로, 그 외엔 /prefix)
export function resolveLocalThumb(
  url?: string | null,
  fallback = "/img/1bee.jpg"
): string {
  if (isEmpty(url)) return fallback;

  const raw = url!.trim();
  const lower = raw.toLowerCase();

  // "placeholder" 문자열이 포함되면 무조건 폴백
  if (lower.includes("placeholder")) return fallback;

  if (isDataUrl(raw) || isRemote(raw)) return raw;

  return toPublicPath(raw);
}
