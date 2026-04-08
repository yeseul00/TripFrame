import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Trip } from '@tripframe/core';

export const WIDGET_DATA_KEY = '@tripframe/widget-data';

export interface WidgetData {
  tripTitle: string;
  /** 양수 = D-n(출발 전), 0 = D-DAY, 음수 = D+n(여행 중) */
  dDay: number;
  departureDate: string; // "M/D" 표시용
  hasTrip: boolean;
}

export function buildWidgetData(trips: Trip[]): WidgetData {
  const today = new Date();
  const upcoming = trips
    .filter((t) => Boolean(t.startDate))
    .map((t) => ({ trip: t, diff: differenceInCalendarDays(parseISO(t.startDate), today) }))
    .filter(({ diff }) => diff >= 0)
    .sort((a, b) => a.diff - b.diff);

  const next = upcoming[0]?.trip ?? null;
  if (!next) {
    return { tripTitle: '', dDay: 0, departureDate: '', hasTrip: false };
  }

  const dDay = differenceInCalendarDays(parseISO(next.startDate), today);
  const date = parseISO(next.startDate);
  const departureDate = `${date.getMonth() + 1}/${date.getDate()}`;
  return { tripTitle: next.title, dDay, departureDate, hasTrip: true };
}

export async function syncWidgetData(trips: Trip[]): Promise<void> {
  const data = buildWidgetData(trips);
  await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
}

export async function readWidgetData(): Promise<WidgetData | null> {
  const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as WidgetData;
}
