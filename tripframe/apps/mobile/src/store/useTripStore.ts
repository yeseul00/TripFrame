import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptedStorage } from '../storage/encryptedStorage';
import { Trip, DayTimeline, TripEvent } from '@tripframe/core';
import { MOCK_TRIP, MOCK_REVERSE_CALC } from '@tripframe/core';
import type { ReverseCalcResult } from '@tripframe/core';
import { syncEngine } from '../lib/supabaseSync';
import { tripToDbRow } from '../lib/tripMapper';

export type TabName = '홈' | '일정' | '스마트 체크' | '마이';

// ─── 현재 로그인한 userId (App.tsx에서 주입) ───────────────────────────────
let _userId: string | null = null;

export function setStoreUserId(id: string | null) {
  _userId = id;
}

// ─── 타입 ─────────────────────────────────────────────────────────────────
interface TripStore {
  currentTab: TabName;
  trips: Trip[];
  currentTripId: string | null;
  selectedDayIndex: number;
  reverseCalc: ReverseCalcResult;
  openGapKey: string | null;
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
  setTrips: (trips: Trip[]) => void;

  // Event actions
  addEvent: (tripId: string, dayIndex: number, event: TripEvent) => void;
  updateEvent: (tripId: string, dayIndex: number, eventId: string, updates: Partial<TripEvent>) => void;
  deleteEvent: (tripId: string, dayIndex: number, eventId: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────
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

      addTrip: (trip) => {
        set((state) => ({ trips: [...state.trips, trip] }));
        if (_userId) {
          syncEngine.enqueue('UPSERT_TRIP', tripToDbRow(trip, _userId) as never);
        }
      },

      updateTrip: (id, updates) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
        if (_userId) {
          const updated = get().trips.find((t) => t.id === id);
          if (updated) {
            syncEngine.enqueue('UPSERT_TRIP', tripToDbRow(updated, _userId) as never);
          }
        }
      },

      deleteTrip: (id) => {
        set((state) => ({
          trips: state.trips.filter((t) => t.id !== id),
          currentTripId: state.currentTripId === id ? null : state.currentTripId,
        }));
        if (_userId) {
          syncEngine.enqueue('DELETE_TRIP', { id });
        }
      },

      selectTrip: (id) =>
        set({ currentTripId: id, selectedDayIndex: 0, currentTab: '일정' }),

      // Realtime 수신 또는 로그인 시 원격 데이터 병합에 사용
      setTrips: (trips) => set({ trips }),

      addEvent: (tripId, dayIndex, event) => {
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t;
            const base = t.timelines.length === 0
              ? [{ day: 1, date: '', events: [], gaps: [] }]
              : [...t.timelines];
            const timelines = base.map((tl, i) => {
              if (i !== dayIndex) return tl;
              return { ...tl, events: [...tl.events, event] };
            });
            return { ...t, timelines };
          }),
        }));
        if (_userId) {
          const updatedTrip = get().trips.find((t) => t.id === tripId);
          if (updatedTrip) {
            syncEngine.enqueue('UPSERT_TRIP', tripToDbRow(updatedTrip, _userId) as never);
          }
        }
      },

      updateEvent: (tripId, dayIndex, eventId, updates) => {
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
        }));
        if (_userId) {
          const updatedTrip = get().trips.find((t) => t.id === tripId);
          if (updatedTrip) {
            syncEngine.enqueue('UPSERT_TRIP', tripToDbRow(updatedTrip, _userId) as never);
          }
        }
      },

      deleteEvent: (tripId, dayIndex, eventId) => {
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
        }));
        if (_userId) {
          const updatedTrip = get().trips.find((t) => t.id === tripId);
          if (updatedTrip) {
            syncEngine.enqueue('UPSERT_TRIP', tripToDbRow(updatedTrip, _userId) as never);
          }
        }
      },
    }),
    {
      name: 'tripframe-storage',
      storage: createJSONStorage(() => encryptedStorage),
      partialize: (state) => ({
        trips: state.trips,
        currentTripId: state.currentTripId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.trips.length === 0) {
          state.trips = [MOCK_TRIP];
        }
      },
    }
  )
);
