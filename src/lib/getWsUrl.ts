export function getWsUrl() {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  // 배포 환경은 https → wss 로만 변환
  const wsBase = base.replace(/^https/, "wss");
  return `${wsBase}/ws`;
}
