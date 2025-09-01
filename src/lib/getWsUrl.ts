export function getWsUrl() {
  // 배포: https://api.example.com  → wss://api.example.com/ws
  // 로컬: http://localhost:8080     → ws://localhost:8080/ws
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
  ).replace(/\/+$/, "");
  return `${base.replace(/^http/, "ws")}/ws`;
}
