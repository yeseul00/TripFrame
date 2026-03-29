import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptedStorage } from '../storage/encryptedStorage';
import { Trip, DayTimeline, TripEvent } from '@tripframe/core';
import { MOCK_TRIP, MOCK_REVERSE_CALC } from '@tripframe/core';
import type { ReverseCalcResult } from '@tripframe/core';

type TabName = '일정' | '공백감지' | '제안카드' | '역산' | '설정';

interface TripStore {
  currentTab: TabName;
  trips: Trip[];
  currentTripId: string | null;
  selectedDayIndex: number;
  reverseCalc: ReverseCalcResult;

  // Navigation
  setCurrentTab: (tab: TabName) => void;
  setSelectedDay: (index: number) => void;

  // Trip selectors
  currentTrip: () => Trip | null;
  selectedTimeline: () => DayTimeline | null;
  allGaps: () => Trip['timelines'][number]['gaps'];

  // Trip actions
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  selectTrip: (id: string | null) => void;

  // Event actions
  addEvent: (tripId: string, dayIndex: number, event: TripEvent) => void;
  updateEvent: (tripId: string, dayIndex: number, eventId: string, updates: Partial<TripEvent>) => void;
  deleteEvent: (tripId: string, dayIndex: number, eventId: string) => void;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      currentTab: '일정',
      trips: [MOCK_TRIP],
      currentTripId: null,
      selectedDayIndex: 0,
      reverseCalc: MOCK_REVERSE_CALC,

      setCurrentTab: (tab) => set({ currentTab: tab }),
      setSelectedDay: (index) => set({ selectedDayIndex: index }),

      currentTrip: () => {
        const { trips, currentTripId } = get();
        if (!currentTripId) return null;
        return trips.find((t) => t.id === currentTripId) ?? null;
      },

      selectedTimeline: () => {
        const trip = get().currentTrip();
        if (!trip) return null;
        return trip.timelines[get().selectedDayIndex] ?? null;
      },

      allGaps: () => {
        const trip = get().currentTrip();
        if (!trip) return [];
        return trip.timelines.flatMap((t) => t.gaps);
      },

      addTrip: (trip) =>
        set((state) => ({ trips: [...state.trips, trip] })),

      updateTrip: (id, updates) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTrip: (id) =>
        set((state) => ({
          trips: state.trips.filter((t) => t.id !== id),
          currentTripId: state.currentTripId === id ? null : state.currentTripId,
        })),

      selectTrip: (id) =>
        set({ currentTripId: id, selectedDayIndex: 0, currentTab: '일정' }),

      addEvent: (tripId, dayIndex, event) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t;
            // 빈 여행: dayIndex=0에 첫 타임라인 자동 생성
            const base = t.timelines.length === 0
              ? [{ day: 1, date: '', events: [], gaps: [] }]
              : [...t.timelines];
            const timelines = base.map((tl, i) => {
              if (i !== dayIndex) return tl;
              return { ...tl, events: [...tl.events, event] };
            });
            return { ...t, timelines };
          }),
        })),

      updateEvent: (tripId, dayIndex, eventId, updates) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t;
            const timelines = t.timelines.map((tl, i) => {
              if (i !== dayIndex) return tl;
              return {
                ...tl,
                events: tl.events.map((e) =>
                  e.id === eventId ? { ...e, ...updates } : e
                ),
              };
            });
            return { ...t, timelines };
          }),
        })),

      deleteEvent: (tripId, dayIndex, eventId) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t;
            const timelines = t.timelines.map((tl, i) => {
              if (i !== dayIndex) return tl;
              return {
                ...tl,
                events: tl.events.filter((e) => e.id !== eventId),
              };
            });
            return { ...t, timelines };
          }),
        })),
    }),
    {
      name: 'tripframe-storage',
      storage: createJSONStorage(() => encryptedStorage),
      partialize: (state) => ({
        trips: state.trips,
        currentTripId: state.currentTripId,
      }),
      onRehydrateStorage: () => (state) => {
        // 첫 실행 시 trips가 비어있으면 Mock 데이터 삽입
        if (state && state.trips.length === 0) {
          state.trips = [MOCK_TRIP];
        }
      },
    }
  )
);
