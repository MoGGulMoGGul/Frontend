"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createStompService,
  APP_PREFIX,
  TOPIC_PREFIX,
  USER_PREFIX,
  StompMessage,
} from "@/lib/stompClient";
import { useAuthStore } from "@/stores/useAuthStore";

export type SubscriptionSpec<T> = {
  destination: string;
  onMessage: (msg: StompMessage<T>) => void;
};

export function useRealtime<T = unknown>(subscriptions: SubscriptionSpec<T>[]) {
  const accessToken = useAuthStore(
    (s) => (s as { accessToken: string | null }).accessToken
  );

  const stomp = useMemo(
    () => createStompService(() => accessToken),
    [accessToken]
  );
  const [connected, setConnected] = useState(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    stomp.connect(
      () => {
        setConnected(true);
        unsubsRef.current = subscriptions.map((spec) => {
          const sub = stomp.subscribe(spec.destination, spec.onMessage);
          return () => sub.unsubscribe();
        });
      },
      () => setConnected(false)
    );

    return () => {
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = [];
      stomp.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    stomp.refreshConnectHeaders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const send = (path: string, payload?: T) => {
    stomp.publish(path, payload);
  };

  return { connected, send, APP_PREFIX, TOPIC_PREFIX, USER_PREFIX } as const;
}
