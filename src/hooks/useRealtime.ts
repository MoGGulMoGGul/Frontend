"use client";

import { useEffect, useRef, useState } from "react";
import {
  createStompService,
  APP_PREFIX,
  TOPIC_PREFIX,
  USER_PREFIX,
  type StompMessage,
} from "@/lib/stompClient";
import { useAuthStore } from "@/stores/useAuthStore";

// 구독 스펙
export type SubscriptionSpec<T = unknown> = {
  destination: string;
  onMessage: (msg: StompMessage<T>) => void;
};

type Options = {
  /** true일 때만 연결 시도 (예: 토큰 준비 후) */
  shouldConnect?: boolean;
};

function useRealtime<T = unknown>(
  subscriptions: ReadonlyArray<SubscriptionSpec<T>>,
  options: Options = {}
) {
  const { shouldConnect = true } = options;

  // 최신 토큰은 getState()로 읽어서 콜백이 항상 최신값 사용
  const accessToken = useAuthStore((s) => s.accessToken);
  const getTokenNow = () => useAuthStore.getState().accessToken;

  const stompRef = useRef<ReturnType<typeof createStompService> | null>(null);
  const [connected, setConnected] = useState(false);
  const unsubsRef = useRef<Array<() => void>>([]);

  // STOMP 서비스 인스턴스 단일화
  if (!stompRef.current) {
    stompRef.current = createStompService(() => getTokenNow() || undefined);
  }
  const stomp = stompRef.current;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 호출자가 연결을 막으면 스킵
    if (!shouldConnect) return;

    // 개인큐가 전제인 서비스라면: 토큰 없으면 연결하지 않음
    if (!getTokenNow()) return;

    const onConnected = () => {
      setConnected(true);

      // 기존 구독 정리 후 재구독
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = [];

      // 한 틱 늦춰서 구독 (레이스 방지)
      Promise.resolve().then(() => {
        unsubsRef.current = subscriptions.map((spec) => {
          const sub = stomp.subscribe<T>(spec.destination, spec.onMessage);
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
      // 전역 공유형이면 disconnect를 생략해도 되지만,
      // 현재 훅 생명주기와 1:1로 맞추려면 끊어줌
      void stomp.disconnect();
    };
    // 토큰 유무/shouldConnect 변화에 반응
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldConnect, !!accessToken]);

  // 토큰 값 변경 시 CONNECT 헤더 재주입(내부에서 안전하게 재설정)
  useEffect(() => {
    stomp.refreshConnectHeaders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const send = (path: string, payload?: T) => {
    stomp.publish(path, payload);
  };

  return {
    connected,
    send,
    APP_PREFIX,
    TOPIC_PREFIX,
    USER_PREFIX,
  } as const;
}

export { useRealtime };
export default useRealtime;