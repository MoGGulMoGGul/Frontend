"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  ensureStomp,
  ensureSubscribe,
  refreshConnectHeaders,
  USER_PREFIX,
  TOPIC_PREFIX,
  type StompMessage,
} from "@/lib/stompSingleton";

/** 서버가 보내는 알림 페이로드(확장 가능) */
export type Notification = {
  id?: number;
  message: string;
} & Record<string, unknown>;

function parseJsonSafe(input: unknown): unknown {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}
function isNotification(v: unknown): v is Notification {
  return (
    typeof v === "object" &&
    v !== null &&
    "message" in v &&
    typeof (v as { message: unknown }).message === "string"
  );
}

const NotificationContext = createContext<Notification[]>([]);

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 토큰 준비 후에만 연결 (빈 CONNECT 방지)
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const authReady = useAuthStore((s) => s.authReady);

  // 싱글톤 연결 + 구독
  useEffect(() => {
    const shouldConnect = !!(hasHydrated && authReady && accessToken);
    if (!shouldConnect) return;

    // 1) 연결 보장
    ensureStomp(
      () => useAuthStore.getState().accessToken ?? null,
      () => {
        // 2) onConnected: 필요한 목적지 구독 (중복 방지됨)
        ensureSubscribe(`${TOPIC_PREFIX}/feed`, (m: StompMessage<unknown>) => {
          const payload = parseJsonSafe(m.body);
          console.log("📢 FEED", payload);
        });

        ensureSubscribe(
          `${USER_PREFIX}/queue/notifications`,
          (m: StompMessage<unknown>) => {
            const payload = parseJsonSafe(m.body);
            if (isNotification(payload)) {
              setNotifications((prev) => [payload, ...prev].slice(0, 50));
            } else {
              console.warn("📬 ME(unrecognized payload)", payload);
            }
          }
        );

        ensureSubscribe(
          `${TOPIC_PREFIX}/tips/rank/views`,
          (m: StompMessage<unknown>) => {
            const payload = parseJsonSafe(m.body);
            console.log("🏆 RANK", payload);
          }
        );
      }
    );

    // 3) 토큰 갱신 대응(옵션): 액세스 토큰이 바뀌면 연결 재설정
    refreshConnectHeaders();

    return () => {
      // 페이지 전환 등에서 끊고 싶으면 아래 줄 유지
      // disconnectStomp();
      // 전역 유지 원하면 끊지 말고 그대로 두세요.
    };
  }, [hasHydrated, authReady, accessToken]);

  const value = useMemo(() => notifications, [notifications]);
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
