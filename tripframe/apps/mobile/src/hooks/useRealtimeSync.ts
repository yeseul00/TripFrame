import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeSync(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

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
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);
}
