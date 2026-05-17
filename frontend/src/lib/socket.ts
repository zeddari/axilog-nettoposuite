/**
 * Singleton Socket.IO namespace factories.
 * We authenticate via the HttpOnly cookie that the browser sends automatically
 * when `withCredentials: true` is set — no need to pass a token manually.
 */
import { io, type Socket } from 'socket.io-client';

const BASE = import.meta.env.VITE_WS_URL ?? '';

type NSPath = '/topology' | '/alarms' | '/traffic';

const sockets = new Map<NSPath, Socket>();

export function getSocket(ns: NSPath): Socket {
  if (sockets.has(ns)) return sockets.get(ns)!;

  const s = io(`${BASE}${ns}`, {
    withCredentials: true,
    transports:      ['websocket', 'polling'],
    autoConnect:     false,   // connect lazily when first hook mounts
    reconnection:    true,
    reconnectionDelay:        1_000,
    reconnectionDelayMax:     10_000,
    reconnectionAttempts:     Infinity,
  });

  sockets.set(ns, s);
  return s;
}

export function disconnectSocket(ns: NSPath) {
  sockets.get(ns)?.disconnect();
  sockets.delete(ns);
}
