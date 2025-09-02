export function getWsUrl() {
  // 배포: https://api.example.com  → wss://api.example.com/ws
  // 로컬: http://localhost:8080     → ws://localhost:8080/ws
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
  ).replace(/\/+$/, "");
  const url = `${base.replace(/^http/, "ws")}/ws`;
  if (process.env.NODE_ENV !== "production") {
    console.log("[WS URL]", url); // ← 함수 바깥에서 만든 값을 찍기만!
  }
  return url;
}
