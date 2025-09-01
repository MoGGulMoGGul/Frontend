"use client";

import { useEffect } from "react";
import { useNotifications } from "@/app/components/layout/NotificationContext"; // 경로 맞게 조정
// 연결 상태 뱃지용으로만 쓰고 싶다면, connected를 Provider에서 내려주는 식으로 확장해도 됩니다.

export default function AlarmConsole() {
  const notifications = useNotifications();

  // 새 알림이 들어올 때마다 콘솔에 찍기
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      console.log("[NOTI in AlarmConsole]", latest);
    }
  }, [notifications]);

  // 간단한 뱃지 표시 (원하면 갯수 등 표시)
  return (
    <div className="text-xs px-2 py-1 rounded border inline-flex items-center gap-2">
      <span>WS</span>
      <span
        className={notifications.length ? "text-green-600" : "text-gray-400"}
      >
        {notifications.length ? "connected" : "idle"}
      </span>
    </div>
  );
}
