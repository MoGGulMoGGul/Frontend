"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    const socket = new WebSocket("wss://your-websocket-url");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications((prev) => [data, ...prev]); // 최신순 추가
    };

    return () => socket.close();
  }, []);

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
