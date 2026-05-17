import { useEffect, useCallback } from 'react';
import { useQueryClient }         from '@tanstack/react-query';
import { getSocket }              from '@/lib/socket';

export interface AlarmCounts {
  CRITICAL: number; MAJOR: number; MINOR: number; WARNING: number;
}

export interface LiveAlarm {
  id: string; severity: string; title: string; source: string;
  topologyId: string | null; nodeId: string | null; createdAt: string;
}

/**
 * Subscribes to the /alarms namespace.
 * Updates TanStack Query cache keys used by AlarmBanner and DashboardPage
 * so they re-render without a full HTTP poll.
 */
export function useAlarmSocket() {
  const queryClient = useQueryClient();
  const socket      = getSocket('/alarms');

  const onCounts = useCallback((counts: AlarmCounts) => {
    queryClient.setQueryData(['alarm-counts'], counts);
  }, [queryClient]);

  const onNewAlarm = useCallback((alarm: LiveAlarm) => {
    // Prepend to recent-alarms list (cap at 20)
    queryClient.setQueryData<LiveAlarm[]>(['recent-alarms'], prev => {
      const list = prev ?? [];
      return [alarm, ...list].slice(0, 20);
    });
    // Bump counts
    queryClient.invalidateQueries({ queryKey: ['alarm-counts'] });
  }, [queryClient]);

  const onCleared = useCallback(({ id }: { id: string }) => {
    queryClient.setQueryData<LiveAlarm[]>(['recent-alarms'], prev =>
      (prev ?? []).filter(a => a.id !== id)
    );
    queryClient.invalidateQueries({ queryKey: ['alarm-counts'] });
  }, [queryClient]);

  const onRecent = useCallback((alarms: LiveAlarm[]) => {
    queryClient.setQueryData(['recent-alarms'], alarms);
  }, [queryClient]);

  useEffect(() => {
    socket.on('alarm:counts', onCounts);
    socket.on('alarm:new',    onNewAlarm);
    socket.on('alarm:cleared', onCleared);
    socket.on('alarm:recent', onRecent);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off('alarm:counts', onCounts);
      socket.off('alarm:new',    onNewAlarm);
      socket.off('alarm:cleared', onCleared);
      socket.off('alarm:recent', onRecent);
    };
  }, [socket, onCounts, onNewAlarm, onCleared, onRecent]);
}
