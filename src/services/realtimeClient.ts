// Production WebSocket Real-Time Client (/ws/realtime)
// Handles authentication, room subscriptions, auto-reconnect state recovery, and WebRTC signaling

type EventHandler = (payload: Record<string, any>) => void;

class AcovonRealtimeClient {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private guestId: string;
  private connectionId: string | null = null;
  private joinedRooms = new Set<string>(['global:live']);
  private listeners = new Map<string, Set<EventHandler>>();
  private anyListeners = new Set<(type: string, payload: Record<string, any>) => void>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelayMs = 1000;
  private sendQueue: string[] = [];
  private isConnecting = false;

  constructor() {
    this.guestId = this.loadOrCreateGuestId();
  }

  private loadOrCreateGuestId(): string {
    if (typeof window === 'undefined') return 'guest_ssr';
    try {
      const existing = sessionStorage.getItem('acovon_ws_guest_id');
      if (existing) return existing;
      const created = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('acovon_ws_guest_id', created);
      return created;
    } catch {
      return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
  }

  private getWsUrl(): string {
    if (typeof window === 'undefined') return '';
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams();
    if (this.userId) params.set('userId', this.userId);
    params.set('guestId', this.guestId);
    return `${proto}//${window.location.host}/ws/realtime?${params.toString()}`;
  }

  public connect(userId?: string | null): void {
    const normalizedUid = userId ? String(userId).trim() : null;
    const userChanged = normalizedUid !== this.userId;
    this.userId = normalizedUid;

    if (typeof window === 'undefined') return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (userChanged) {
        this.send({ type: 'auth', userId: this.userId || '', guestId: this.guestId });
      }
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const ws = new WebSocket(this.getWsUrl());
      this.ws = ws;

      ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectDelayMs = 1000;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        // Authenticate and rejoin all subscribed rooms
        this.sendImmediate(ws, { type: 'auth', userId: this.userId || '', guestId: this.guestId });
        for (const room of this.joinedRooms) {
          this.sendImmediate(ws, { type: 'room:join', room });
        }
        // Flush queued signaling packets
        while (this.sendQueue.length > 0 && ws.readyState === WebSocket.OPEN) {
          const raw = this.sendQueue.shift();
          if (raw) ws.send(raw);
        }
      };

      ws.onmessage = evt => {
        try {
          const data = JSON.parse(String(evt.data)) as Record<string, any>;
          if (!data || typeof data.type !== 'string') return;
          if (data.type === 'ws:connected' && data.connectionId) {
            this.connectionId = String(data.connectionId);
          }
          const handlers = this.listeners.get(data.type);
          if (handlers) {
            for (const fn of handlers) {
              try {
                fn(data);
              } catch (err) {
                console.error('WS handler error:', err);
              }
            }
          }
          for (const fn of this.anyListeners) {
            try {
              fn(data.type, data);
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore malformed packet
        }
      };

      ws.onclose = () => {
        this.isConnecting = false;
        if (this.ws === ws) {
          this.ws = null;
        }
        this.scheduleReconnect();
      };

      ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (typeof window === 'undefined' || this.reconnectTimer) return;
    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(10000, Math.round(this.reconnectDelayMs * 1.5));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.userId);
    }, delay);
  }

  private sendImmediate(ws: WebSocket, payload: Record<string, any>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  public send(payload: Record<string, any>): void {
    const serialized = JSON.stringify(payload);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serialized);
    } else {
      this.sendQueue.push(serialized);
      if (this.sendQueue.length > 100) {
        this.sendQueue.shift();
      }
      this.connect(this.userId);
    }
  }

  public joinRoom(room: string): void {
    if (!room) return;
    this.joinedRooms.add(room);
    this.send({ type: 'room:join', room });
  }

  public leaveRoom(room: string): void {
    if (!room) return;
    this.joinedRooms.delete(room);
    this.send({ type: 'room:leave', room });
  }

  public on(type: string, handler: EventHandler): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  }

  public onAny(handler: (type: string, payload: Record<string, any>) => void): () => void {
    this.anyListeners.add(handler);
    return () => {
      this.anyListeners.delete(handler);
    };
  }

  public getConnectionId(): string | null {
    return this.connectionId;
  }
}

export const realtimeClient = new AcovonRealtimeClient();
