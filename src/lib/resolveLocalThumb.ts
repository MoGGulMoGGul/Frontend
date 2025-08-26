/* ==================== 유틸 함수 ==================== */
const isEmpty = (v?: string | null) => !v || !v.trim(); // 빈 문자열/공백/null 처리
const isDataUrl = (s: string) => s.trim().toLowerCase().startsWith("data:"); // 대소문자 안전
const isRemote = (s: string) => {
  const t = s.trim();
  const l = t.toLowerCase();
  return (
    l.startsWith("http://") || l.startsWith("https://") || t.startsWith("//")
  ); // 프로토콜 생략도 허용
};
const toPublicPath = (s: string) => (s.startsWith("/") ? s : `/${s}`);

/* ==================== 이미지 경로 해석 ==================== */
// 로컬 썸네일 경로를 안전하게 변환 (data:, http(s):는 그대로, 그 외엔 /prefix)
export function resolveLocalThumb(
  url?: string | null,
  fallback = "/img/1bee.png" // 프로젝트에서 쓰는 폴백과 통일
): string {
  if (isEmpty(url)) return fallback;

  const raw = url!.trim();
  const lower = raw.toLowerCase();

  // 문자열로 "null"/"undefined" 들어오는 이상치 방어
  if (lower === "null" || lower === "undefined") return fallback;

  // 프로토콜 생략 //example.com 처리
  if (raw.startsWith("//")) return `https:${raw}`;
  if (isDataUrl(raw) || isRemote(raw)) return raw;

  if (!raw.includes("/")) {
    // 서버에서 주는 기본값 별칭 매핑
    if (lower === "default_profile.png" || lower === "default_profile.jpg") {
      return fallback; // 우리 프로젝트 기본 프로필로 치환
    }
    return `/img/${raw}`; // 그냥 파일명이면 /img/ 아래로
  }

  // 그 외는 public 기준 상대경로로 취급
  return toPublicPath(raw);
}
