import { Client, IMessage, StompHeaders } from "@stomp/stompjs";
import { getWsUrl } from "./getWsUrl";

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

  constructor(getToken: TokenProvider) {
    this.getToken = getToken;
  }

  connect(onConnected?: () => void, onDisconnected?: (e?: unknown) => void) {
    if (typeof window === "undefined") return;
    if (this.client?.active) return;

    const token = this.getToken?.();
    const connectHeaders: StompHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    this.client = new Client({
      brokerURL: getWsUrl(), // ★ wss://.../ws 로 직결
      connectHeaders,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => onConnected?.(),
      onWebSocketClose: (evt) => onDisconnected?.(evt),
      onStompError: (frame) =>
        console.error("[STOMP ERROR]", frame.headers["message"], frame.body),
      // debug: (msg) => console.debug("[STOMP]", msg),
    });

    this.client.activate();
  }

  async disconnect() {
    if (!this.client) return;
    await this.client.deactivate();
    this.client = null;
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
    if (!this.client?.connected) throw new Error("STOMP not connected");
    return this.client.subscribe(destination, (m: IMessage) => {
      const body = (() => {
        try {
          return JSON.parse(m.body) as T;
        } catch {
          return m.body as unknown as T;
        }
      })();
      cb({ destination, headers: m.headers as Record<string, string>, body });
    });
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
