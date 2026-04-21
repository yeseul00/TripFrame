import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchRemoteTrips } from '../lib/supabaseSync';
import { dbRowToTrip, mergeTripsOnLogin } from '../lib/tripMapper';
import { useTripStore } from '../store/useTripStore';

export type SyncStatus = 'idle' | 'connected' | 'offline';

export function useRealtimeSync(userId: string | null): SyncStatus {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    if (!userId || !supabase) {
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
        () => {
          // 원격에서 변경 감지 → 전체 재조회 후 로컬 store와 병합
          fetchRemoteTrips(userId).then((rows) => {
            if (rows.length === 0) return;
            const remoteTrips = rows.map(dbRowToTrip);
            const localTrips = useTripStore.getState().trips;
            const merged = mergeTripsOnLogin(localTrips, remoteTrips);
            useTripStore.getState().setTrips(merged);
          });
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
