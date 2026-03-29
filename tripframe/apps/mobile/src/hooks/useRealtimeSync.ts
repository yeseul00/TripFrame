import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type SyncStatus = 'idle' | 'connected' | 'offline';

export function useRealtimeSync(userId: string | null): SyncStatus {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    if (!userId) {
      setSyncStatus('idle');
      return;
    }

    const channel = supabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Trip 변경 감지:', payload.eventType, payload.new);
          // TODO: TASK-040 store와 연동 시 여기서 useTripStore.getState().syncFromRemote() 호출
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          console.log('[Realtime] Event 변경 감지:', payload.eventType, payload.new);
        },
      )
      .subscribe((status) => {
        console.log('[Realtime] 구독 상태:', status);
        if (status === 'SUBSCRIBED') setSyncStatus('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setSyncStatus('offline');
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return syncStatus;
}
