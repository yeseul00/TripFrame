export type Timestamped = { updated_at: string };

/**
 * Last Write Wins: updated_at 기준으로 더 최신 데이터를 반환
 */
export function resolveConflict<T extends Timestamped>(local: T, remote: T): T {
  const localTime = new Date(local.updated_at).getTime();
  const remoteTime = new Date(remote.updated_at).getTime();

  if (localTime >= remoteTime) {
    console.log('[Conflict] Local wins:', local.updated_at);
    return local;
  }

  console.log('[Conflict] Remote wins:', remote.updated_at);
  return remote;
}
