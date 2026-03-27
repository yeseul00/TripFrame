import { create } from 'zustand';
import { Trip, DayTimeline } from '@tripframe/core';
import { MOCK_TRIP, MOCK_REVERSE_CALC } from '@tripframe/core';
import type { ReverseCalcResult } from '@tripframe/core';

type TabName = '일정' | '공백감지' | '제안카드' | '역산';

interface TripStore {
  currentTab: TabName;
  trip: Trip;
  selectedDayIndex: number;
  reverseCalc: ReverseCalcResult;

  setCurrentTab: (tab: TabName) => void;
  setSelectedDay: (index: number) => void;
  selectedTimeline: () => DayTimeline;
  allGaps: () => Trip['timelines'][number]['gaps'];
}

export const useTripStore = create<TripStore>((set, get) => ({
  currentTab: '일정',
  trip: MOCK_TRIP,
  selectedDayIndex: 0,
  reverseCalc: MOCK_REVERSE_CALC,

  setCurrentTab: (tab) => set({ currentTab: tab }),
  setSelectedDay: (index) => set({ selectedDayIndex: index }),

  selectedTimeline: () => get().trip.timelines[get().selectedDayIndex],

  allGaps: () =>
    get().trip.timelines.flatMap((t) => t.gaps),
}));
