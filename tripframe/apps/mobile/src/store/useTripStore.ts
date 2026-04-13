import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptedStorage } from '../storage/encryptedStorage';
import { Trip, DayTimeline, TripEvent } from '@tripframe/core';
import { MOCK_TRIP, MOCK_REVERSE_CALC } from '@tripframe/core';
import type { ReverseCalcResult } from '@tripframe/core';

export type TabName = '홈' | '일정' | '스마트 체크' | '마이';

interface TripStore {
  currentTab: TabName;
  trips: Trip[];
  currentTripId: string | null;
  selectedDayIndex: number;
  reverseCalc: ReverseCalcResult;
  /** 딥링크: 스마트 체크 탭에서 자동 펼칠 gapKey */
  openGapKey: string | null;
  /** 스마트 타임라인(역산) 모달 표시 여부 */
  showReverseCalcModal: boolean;

  // Navigation
  setCurrentTab: (tab: TabName) => void;
  setSelectedDay: (index: number) => void;
  setOpenGapKey: (key: string | null) => void;
  openReverseCalcModal: () => void;
  closeReverseCalcModal: () => void;

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
      currentTab: '홈',
      trips: [MOCK_TRIP],
      currentTripId: null,
      selectedDayIndex: 0,
      reverseCalc: MOCK_REVERSE_CALC,
      openGapKey: null,
      showReverseCalcModal: false,

      setCurrentTab: (tab) => set({ currentTab: tab }),
      setSelectedDay: (index) => set({ selectedDayIndex: index }),
      setOpenGapKey: (key) => set({ openGapKey: key }),
      openReverseCalcModal: () => set({ showReverseCalcModal: true }),
      closeReverseCalcModal: () => set({ showReverseCalcModal: false }),

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
