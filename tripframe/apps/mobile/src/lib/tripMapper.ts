/**
 * TripFrame Trip ↔ Supabase DB row 변환 유틸
 *
 * - tripToDbRow : 앱 Trip → trips 테이블 upsert payload
 * - dbRowToTrip : trips 테이블 row → 앱 Trip
 */
import type { Trip, DayTimeline } from '@tripframe/core';

export interface TripDbRow {
  id: string;
  user_id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  timelines: DayTimeline[];
  updated_at: string;
}

/** 앱 Trip → DB upsert row */
export function tripToDbRow(trip: Trip, userId: string): TripDbRow {
  return {
    id: trip.id,
    user_id: userId,
    title: trip.title,
    destination: trip.destination ?? null,
    start_date: trip.startDate || null,
    end_date: trip.endDate || null,
    timelines: trip.timelines,
    updated_at: new Date().toISOString(),
  };
}

/** DB row → 앱 Trip */
export function dbRowToTrip(row: Record<string, unknown>): Trip {
  let timelines: DayTimeline[] = [];
  if (typeof row['timelines'] === 'string') {
    try { timelines = JSON.parse(row['timelines']); } catch { timelines = []; }
  } else if (Array.isArray(row['timelines'])) {
    timelines = row['timelines'] as DayTimeline[];
  }

  return {
    id: row['id'] as string,
    title: (row['title'] as string) ?? '',
    destination: (row['destination'] as string | null) ?? undefined,
    startDate: (row['start_date'] as string | null) ?? '',
    endDate: (row['end_date'] as string | null) ?? '',
    timelines,
  };
}

/** 로그인 시 병합: remote 우선, local-only 여행은 보존 */
export function mergeTripsOnLogin(local: Trip[], remote: Trip[]): Trip[] {
  const remoteMap = new Map(remote.map((t) => [t.id, t]));
  const localOnly = local.filter((t) => !remoteMap.has(t.id));
  return [...remote, ...localOnly];
}
