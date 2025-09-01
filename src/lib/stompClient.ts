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

class StompService {
  private client: Client | null = null;
  private getToken: TokenProvider;

  // 연결되기 전에 들어온 구독을 저장해두는 큐
  private pendingSubs: Array<{
    destination: string;
    handler: (m: IMessage) => void;
    setUnsub: (fn: () => void) => void;
  }> = [];

  constructor(getToken: TokenProvider) {
    this.getToken = getToken;
  }

  isConnected() {
    return !!this.client?.connected;
  }

  connect(onConnected?: () => void, onDisconnected?: (e?: unknown) => void) {
    if (typeof window === "undefined") return;
    if (this.client?.active) return; // 이미 연결 중

    const token = this.getToken?.();
    const connectHeaders: StompHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const url = getWsUrl();

    // debug는 반드시 함수여야 함
    const debugFn = (m: string) => {
      // 필요 시 주석 해제
      console.debug("[STOMP]", m);
    };

    this.client = new Client({
      brokerURL: url,
      connectHeaders,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: debugFn,
      onConnect: () => {
        // 연결됨 → 적체된 구독 flush
        this.flushPendingSubs();
        onConnected?.();
      },
      onWebSocketClose: (evt) => {
        onDisconnected?.(evt);
        // 연결 끊김: 펜딩은 유지, 실제 구독 해제는 useRealtime 쪽에서 처리
      },
      onStompError: (frame) =>
        console.error("[STOMP ERROR]", frame.headers["message"], frame.body),
    });

    this.client.activate();
  }

  private flushPendingSubs() {
    if (!this.client?.connected) return;
    const queued = this.pendingSubs;
    this.pendingSubs = [];
    for (const item of queued) {
      const sub = this.client.subscribe(item.destination, item.handler);
      item.setUnsub(() => sub.unsubscribe());
    }
  }

  async disconnect() {
    if (!this.client) return;
    await this.client.deactivate();
    this.client = null;
    this.pendingSubs = [];
  }

  refreshConnectHeaders() {
    if (!this.client) return;
    const token = this.getToken?.();
    const headers: StompHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    const wasActive = this.client.active;
    if (wasActive) this.client.deactivate();
    this.client.configure({ connectHeaders: headers, brokerURL: getWsUrl() });
    if (wasActive) this.client.activate();
  }

  subscribe<T = unknown>(
    destination: string,
    cb: (msg: StompMessage<T>) => void
  ) {
    const wrap = (m: IMessage) => {
      const body = (() => {
        try {
          return JSON.parse(m.body) as T;
        } catch {
          return m.body as unknown as T;
        }
      })();
      cb({ destination, headers: m.headers as Record<string, string>, body });
    };

    // 아직 client가 없거나 연결 전이면 큐에 적립
    if (!this.client || !this.client.connected) {
      let doUnsub: () => void = () => {};
      this.pendingSubs.push({
        destination,
        handler: wrap,
        setUnsub: (fn) => {
          doUnsub = fn;
        },
      });
      return { unsubscribe: () => doUnsub() };
    }

    // 바로 구독
    const sub = this.client.subscribe(destination, wrap);
    return { unsubscribe: () => sub.unsubscribe() };
  }

  publish(destination: string, body?: unknown, headers?: StompHeaders) {
    if (!this.client?.connected) throw new Error("STOMP not connected");
    this.client.publish({
      destination,
      body: body ? JSON.stringify(body) : "",
      headers,
    });
  }
}

export const createStompService = (getToken: TokenProvider) =>
  new StompService(getToken);
