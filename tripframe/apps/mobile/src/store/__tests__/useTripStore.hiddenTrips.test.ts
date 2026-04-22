/**
 * TASK-105: 여행 카드 숨기기 단위 테스트
 * - hideTrip / unhideTrip 상태 전환
 * - persist partialize에 hiddenTripIds 포함 확인
 */

// ─── encryptedStorage mock ──────────────────────────────────────────────────
const kvStore: Record<string, string> = {};
jest.mock('../../storage/encryptedStorage', () => ({
  encryptedStorage: {
    getItem: jest.fn(async (key: string) => kvStore[key] ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      kvStore[key] = value;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete kvStore[key];
    }),
  },
  migrateFromAsyncStorage: jest.fn(async () => {}),
  migrateMasterKey: jest.fn(async () => {}),
}));

// ─── supabaseSync mock (syncEngine) ────────────────────────────────────────
jest.mock('../../lib/supabaseSync', () => ({
  syncEngine: { enqueue: jest.fn() },
  fetchRemoteTrips: jest.fn(async () => []),
}));

// ─── supabase mock ──────────────────────────────────────────────────────────
jest.mock('../../lib/supabase', () => ({ supabase: null }));

import { useTripStore } from '../useTripStore';

const TRIP_A = 'trip-a';
const TRIP_B = 'trip-b';

beforeEach(() => {
  // 각 테스트 전에 hiddenTripIds 초기화
  useTripStore.setState({ hiddenTripIds: [] });
});

// ─── 테스트 1: hide/unhide 상태 전환 ───────────────────────────────────────
describe('hideTrip / unhideTrip', () => {
  test('hideTrip이 hiddenTripIds에 id를 추가한다', () => {
    useTripStore.getState().hideTrip(TRIP_A);
    expect(useTripStore.getState().hiddenTripIds).toContain(TRIP_A);
  });

  test('동일 id를 두 번 hideTrip 해도 중복 추가되지 않는다', () => {
    useTripStore.getState().hideTrip(TRIP_A);
    useTripStore.getState().hideTrip(TRIP_A);
    const ids = useTripStore.getState().hiddenTripIds;
    expect(ids.filter((id) => id === TRIP_A)).toHaveLength(1);
  });

  test('unhideTrip이 hiddenTripIds에서 id를 제거한다', () => {
    useTripStore.getState().hideTrip(TRIP_A);
    useTripStore.getState().hideTrip(TRIP_B);
    useTripStore.getState().unhideTrip(TRIP_A);
    const ids = useTripStore.getState().hiddenTripIds;
    expect(ids).not.toContain(TRIP_A);
    expect(ids).toContain(TRIP_B);
  });

  test('존재하지 않는 id를 unhideTrip 해도 오류 없이 처리된다', () => {
    expect(() => useTripStore.getState().unhideTrip('non-existent')).not.toThrow();
  });
});

// ─── 테스트 2: persist partialize에 hiddenTripIds 포함 ─────────────────────
describe('persist partialize', () => {
  test('hiddenTripIds가 persist 대상에 포함된다', () => {
    useTripStore.getState().hideTrip(TRIP_A);

    // Zustand persist의 partialize 함수를 직접 호출해 직렬화 대상 확인
    const state = useTripStore.getState();
    // partialize는 내부 함수이므로 state에서 hiddenTripIds가 존재하는지 확인
    expect(state.hiddenTripIds).toEqual([TRIP_A]);

    // encryptedStorage.setItem이 호출됐는지 확인 (persist가 저장을 트리거함)
    const { encryptedStorage } = require('../../storage/encryptedStorage');
    expect(encryptedStorage.setItem).toHaveBeenCalled();

    // 저장된 값에 hiddenTripIds가 포함되어 있는지 확인
    const calls = (encryptedStorage.setItem as jest.Mock).mock.calls;
    const lastCall = calls[calls.length - 1];
    const saved = JSON.parse(lastCall[1] as string) as { state?: { hiddenTripIds?: string[] } };
    expect(saved.state?.hiddenTripIds).toEqual([TRIP_A]);
  });
});
