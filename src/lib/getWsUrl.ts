export function getWsUrl() {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  // http: → ws:, https: → wss:
  const wsBase = base.replace(/^https?:/, (m) =>
    m === "https:" ? "wss:" : "ws:"
  );
  return `${wsBase}/ws`;
}
