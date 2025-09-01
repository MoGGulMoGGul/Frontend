"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import { USER_PREFIX } from "@/lib/stompClient";

type Notification = {
  id: number;
  message: string;
};

const NotificationContext = createContext<Notification[]>([]);

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ✅ subscriptions 배열이 매 렌더마다 바뀌지 않도록 메모이즈
  const subs = useMemo(
    () => [
      {
        destination: `${USER_PREFIX}/queue/notifications`,
        onMessage: (m: { body: Notification }) => {
          console.log("[PERSONAL NOTI]", m.body);
          setNotifications((prev) => [m.body, ...prev]);
        },
      },
      // 필요하면 topic도 추가 가능
      // {
      //   destination: `/topic/feed`,
      //   onMessage: (m) => console.log("[FEED]", m.body),
      // },
    ],
    []
  );

  const { connected } = useRealtime<Notification>(subs);

  useEffect(() => {
    if (connected) console.log("[WS] NotificationProvider connected");
  }, [connected]);

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
