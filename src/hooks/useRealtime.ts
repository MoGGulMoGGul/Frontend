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

export type SubscriptionSpec<T> = {
  destination: string;
  onMessage: (msg: StompMessage<T>) => void;
};

export function useRealtime<T = unknown>(subscriptions: SubscriptionSpec<T>[]) {
  // 최신 토큰은 getState()로 읽도록 해서 콜백이 항상 최신값을 가져가게 함
  const accessToken = useAuthStore(
    (s) => (s as { accessToken: string | null }).accessToken
  );
  const getTokenNow = () => useAuthStore.getState().accessToken;

  const stompRef = useRef<ReturnType<typeof createStompService> | null>(null);
  const [connected, setConnected] = useState(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  // 인스턴스는 1회 생성 고정
  if (!stompRef.current) {
    stompRef.current = createStompService(() => getTokenNow() || undefined);
  }
  const stomp = stompRef.current;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onConnected = () => {
      setConnected(true);
      // 중복 방지: 재연결 시 기존 구독 정리 후 재구독
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = subscriptions.map((spec) => {
        const sub = stomp.subscribe(spec.destination, spec.onMessage);
        return () => sub.unsubscribe();
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
    // subscriptions 구성이 동적으로 바뀌지 않는다면 deps 비워두는 게 OK.
    // 바뀐다면 JSON.stringify(subscriptions)를 deps에 넣어 재구독 트리거하세요.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 토큰 변경 시, 동일 연결에서 헤더만 갱신 (재연결 포함하여 안전)
  useEffect(() => {
    stomp.refreshConnectHeaders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const send = (path: string, payload?: T) => {
    stomp.publish(path, payload);
  };

  return { connected, send, APP_PREFIX, TOPIC_PREFIX, USER_PREFIX } as const;
}
