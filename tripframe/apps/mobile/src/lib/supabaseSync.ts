import { supabase } from './supabase';
import { SyncEngine } from '@tripframe/core';
import type { SyncTask } from '@tripframe/core';
import { resolveConflict } from '@tripframe/core';

async function executeTask(task: SyncTask): Promise<void> {
  if (!supabase) return;

  switch (task.type) {
    case 'UPSERT_TRIP':
      await supabase.from('trips').upsert(task.payload as never);
      break;
    case 'DELETE_TRIP':
      await supabase.from('trips').delete().eq('id', task.payload['id']);
      break;
    case 'UPSERT_EVENT':
      await supabase.from('events').upsert(task.payload as never);
      break;
    case 'DELETE_EVENT':
      await supabase.from('events').delete().eq('id', task.payload['id']);
      break;
  }
}

export const syncEngine = new SyncEngine(executeTask);

export type RemoteTrip = { id: string; updated_at: string; [key: string]: unknown };

export async function fetchRemoteTrips(userId: string): Promise<RemoteTrip[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[supabaseSync] Trip 불러오기 실패:', error.message);
    return [];
  }

  return (data ?? []) as RemoteTrip[];
}

export function mergeWithRemote<T extends { id: string; updated_at: string }>(
  local: T[],
  remote: T[],
): T[] {
  const localMap = new Map(local.map((item) => [item.id, item]));

  for (const remoteItem of remote) {
    const localItem = localMap.get(remoteItem.id);
    if (localItem) {
      localMap.set(remoteItem.id, resolveConflict(localItem, remoteItem));
    } else {
      localMap.set(remoteItem.id, remoteItem);
    }
  }

  return Array.from(localMap.values());
}
