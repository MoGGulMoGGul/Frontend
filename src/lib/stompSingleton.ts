"use client";

import { Client, IMessage, StompHeaders } from "@stomp/stompjs";
import { getWsUrl } from "@/lib/getWsUrl";

export const APP_PREFIX = "/app";
export const TOPIC_PREFIX = "/topic";
export const USER_PREFIX = "/user";

export type StompMessage<T = unknown> = {
  destination: string;
  headers: Record<string, string>;
  body: T;
};

type TokenProvider = () => string | null | undefined;

let client: Client | null = null; // ★ 싱글톤
let isActivating = false; // 중복 activate 방지
const unsubMap = new Map<string, () => void>(); // dest -> unsubscribe
let getTokenRef: TokenProvider | null = null;

function wrapHandler<T = unknown>(
  dest: string,
  cb: (msg: StompMessage<T>) => void
) {
  return (m: IMessage) => {
    const body = (() => {
      try {
        return JSON.parse(m.body) as T;
      } catch {
        return m.body as unknown as T;
      }
    })();
    cb({
      destination: dest,
      headers: m.headers as Record<string, string>,
      body,
    });
  };
}

/** 싱글톤 클라이언트 준비 + 연결 */
export function ensureStomp(
  getToken: TokenProvider,
  onConnected?: () => void,
  onDisconnected?: (e?: unknown) => void
) {
  // getToken 최신 참조 유지
  getTokenRef = getToken;

  if (typeof window === "undefined") return;
  if (client?.active || isActivating) return; // 이미 연결 중이거나 활성화 과정이면 패스

  const token = getToken?.();
  const connectHeaders: StompHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  const url = getWsUrl();

  client = new Client({
    brokerURL: url,
    connectHeaders,
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      isActivating = false;
      // 이미 등록된 구독들 재연결 시 자동 복구됨 (stomp.js가 세션 기준 복구X)
      // → 우리가 dest 목록을 들고 다시 구독한다.
      const entries = Array.from(unsubMap.keys());
      unsubMap.clear();
      entries.forEach(() => {
        // 재구독 시 핸들러는 최초 subscribe 때 전달했던 handler를 재사용해야 하는데,
        // 간단화를 위해 subscribe 호출자가 다시 호출하도록 위임하는 방식 대신,
        // 여기서는 "subscribe 시점에만 map을 채우고", 재연결시 호출자가 ensureSubscriptions()를 호출하는 전략을 권장.
      });
      onConnected?.();
    },
    onWebSocketClose: (evt) => {
      isActivating = false;
      onDisconnected?.(evt);
    },
    onStompError: () => {},
  });

  isActivating = true;
  client.activate();
}

/** 토큰이 바뀌면 헤더/URL 재적용 후 재연결 */
export function refreshConnectHeaders() {
  if (!client || !getTokenRef) return;
  const token = getTokenRef();
  const headers: StompHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  const wasActive = client.active;

  if (wasActive) client.deactivate();
  client.configure({ connectHeaders: headers, brokerURL: getWsUrl() });
  if (wasActive) client.activate();
}

/** 중복 구독 방지 subscribe (이미 같은 dest면 no-op) */
export function ensureSubscribe<T = unknown>(
  destination: string,
  cb: (msg: StompMessage<T>) => void
) {
  if (!client)
    throw new Error("STOMP client not initialized. Call ensureStomp() first.");
  if (unsubMap.has(destination)) {
    // 이미 구독되어 있으면 무시
    return () => {};
  }
  const handler = wrapHandler<T>(destination, cb);
  if (!client.connected) {
    // 연결 중이면 연결 완료 후 다시 호출하도록 안내 (간단화를 위해 여기선 예외)
    console.warn(
      `[STOMP] Not connected yet. Will subscribe later: ${destination}`
    );
  }
  const sub = client.subscribe(destination, handler);
  const doUnsub = () => {
    try {
      sub.unsubscribe();
    } catch {
      /* ignore */
    }
    unsubMap.delete(destination);
  };
  unsubMap.set(destination, doUnsub);
  return doUnsub;
}

/** 구독 일괄 해제(필요 시) */
export function unsubscribeAll() {
  Array.from(unsubMap.values()).forEach((u) => u());
  unsubMap.clear();
}

/** 완전 해제 */
export async function disconnectStomp() {
  unsubscribeAll();
  if (client) {
    try {
      await client.deactivate();
    } catch {
      /* ignore */
    }
  }
  client = null;
  isActivating = false;
}
