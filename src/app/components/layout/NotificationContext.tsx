"use client";

import { createContext, useContext, useMemo, useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import {
  USER_PREFIX,
  TOPIC_PREFIX,
  type StompMessage,
} from "@/lib/stompClient";
import { useAuthStore } from "@/stores/useAuthStore";

/** 서버가 보내는 알림 페이로드(확장 가능) */
export type Notification = {
  id?: number;
  message: string;
} & Record<string, unknown>;

/** 안전 파싱: string | unknown → unknown */
function parseJsonSafe(input: unknown): unknown {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

/** 타입 가드: unknown → Notification 여부 판정 */
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

  // 구독 목록을 훅에 넘김 (rt.client 직접 접근 X)
  const subs = useMemo(
    () => [
      // 공개 피드
      {
        destination: `${TOPIC_PREFIX}/feed`, // "/topic/feed"
        onMessage: (m: StompMessage<unknown>) => {
          const payload = parseJsonSafe(m.body);
          console.log("📢 FEED", payload);
        },
      },
      // 개인 알림
      {
        destination: `${USER_PREFIX}/queue/notifications`, // "/user/queue/notifications"
        onMessage: (m: StompMessage<unknown>) => {
          const payload = parseJsonSafe(m.body);
          if (isNotification(payload)) {
            console.log("📬 ME", payload);
            setNotifications((prev) => [payload, ...prev].slice(0, 50));
          } else {
            console.warn("📬 ME(unrecognized payload)", payload);
          }
        },
      },
      // 랭크 브로드캐스트
      {
        destination: `${TOPIC_PREFIX}/tips/rank/views`, // "/topic/tips/rank/views"
        onMessage: (m: StompMessage<unknown>) => {
          const payload = parseJsonSafe(m.body);
          console.log("🏆 RANK", payload);
        },
      },
    ],
    []
  );

  // 연결은 토큰 준비 후에만
  useRealtime<Notification>(subs, {
    shouldConnect: !!(hasHydrated && authReady && accessToken),
  });

  const value = useMemo(() => notifications, [notifications]);
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
