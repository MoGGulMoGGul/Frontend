"use client";
import { useRealtime } from "@/hooks/useRealtime";
import { TOPIC_PREFIX, USER_PREFIX } from "@/lib/stompClient";

export default function AlarmConsole() {
  const { connected } = useRealtime([
    {
      destination: `${USER_PREFIX}/queue/notifications`,
      onMessage: (m) => {
        console.log("[FOLLOWING_TIP_CREATED or 개인 알림]", m);
      },
    },
    {
      destination: `${TOPIC_PREFIX}/notifications`,
      onMessage: (m) => {
        console.log("[GROUP_TIP_CREATED or 공용 알림]", m);
      },
    },
  ]);

  return (
    <div className="text-xs px-2 py-1 rounded border inline-flex items-center gap-2">
      <span>WS</span>
      <span className={connected ? "text-green-600" : "text-gray-400"}>
        {connected ? "connected" : "disconnected"}
      </span>
    </div>
  );
}
