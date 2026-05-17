import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';

export type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Returns the current connection state of the /alarms namespace socket,
 * which is the one kept open globally for the alarm banner.
 */
export function useSocketStatus(): SocketStatus {
  const socket = getSocket('/alarms');
  const [status, setStatus] = useState<SocketStatus>(
    socket.connected ? 'connected' : 'disconnected'
  );

  useEffect(() => {
    const onConnect    = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onError      = () => setStatus('error');
    const onReconnect  = () => setStatus('connecting');

    socket.on('connect',             onConnect);
    socket.on('disconnect',          onDisconnect);
    socket.on('connect_error',       onError);
    socket.on('reconnect_attempt',   onReconnect);

    if (!socket.connected) {
      setStatus('connecting');
      socket.connect();
    }

    return () => {
      socket.off('connect',           onConnect);
      socket.off('disconnect',        onDisconnect);
      socket.off('connect_error',     onError);
      socket.off('reconnect_attempt', onReconnect);
    };
  }, [socket]);

  return status;
}
