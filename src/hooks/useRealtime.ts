"use client";

import { useEffect, useRef, useState } from "react";
import {
  createStompService,
  APP_PREFIX,
  TOPIC_PREFIX,
  USER_PREFIX,
  StompMessage,
} from "@/lib/stompClient";
import { useAuthStore } from "@/stores/useAuthStore";

export type SubscriptionSpec<T = unknown> = {
  destination: string;
  onMessage: (msg: StompMessage<T>) => void;
};

function useRealtime<T = unknown>(subscriptions: SubscriptionSpec<T>[]) {
  // 최신 토큰은 getState()로 읽어서 콜백이 항상 최신값 사용
  const accessToken = useAuthStore(
    (s) => (s as { accessToken: string | null }).accessToken
  );
  const getTokenNow = () => useAuthStore.getState().accessToken;

  const stompRef = useRef<ReturnType<typeof createStompService> | null>(null);
  const [connected, setConnected] = useState(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  if (!stompRef.current) {
    stompRef.current = createStompService(() => getTokenNow() || undefined);
  }
  const stomp = stompRef.current;

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 토큰 없으면 연결하지 않음 (개인 큐 사용 시 필수)
    if (!getTokenNow()) return;

    const onConnected = () => {
      setConnected(true);
      // 기존 구독 정리 후 재구독
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = [];
      // 한 틱 늦춰서 구독 (레이스 방지)
      Promise.resolve().then(() => {
        unsubsRef.current = subscriptions.map((spec) => {
          const sub = stomp.subscribe(spec.destination, spec.onMessage);
          return () => sub.unsubscribe();
        });
      });
    };

    const onDisconnected = () => {
      setConnected(false);
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = [];
    };

    stomp.connect(onConnected, onDisconnected);

    return () => {
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = [];
      stomp.disconnect();
    };
    // 토큰 유무만 의존: 토큰 생기면 연결 시도
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!accessToken]);

  // 토큰 값 변경 시 헤더 갱신(내부적으로 안전하게 재설정)
  useEffect(() => {
    stomp.refreshConnectHeaders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const send = (path: string, payload?: T) => {
    stomp.publish(path, payload);
  };

  return { connected, send, APP_PREFIX, TOPIC_PREFIX, USER_PREFIX } as const;
}

export { useRealtime };
export default useRealtime;
