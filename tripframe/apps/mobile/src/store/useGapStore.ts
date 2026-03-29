/**
 * useGapStore — Gap RESOLVED 상태 관리 (TASK-095)
 *
 * Constitution 준수: Gap은 파생 데이터 (Gap 자체에 상태 추가 금지).
 * RESOLVED 상태를 별도 외부 저장소로 관리한다.
 *
 * 구조: { [tripId]: { [gapKey]: { resolvedAt: ISO-8601, method: string } } }
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptedStorage } from '../storage/encryptedStorage';

interface ResolvedGapEntry {
  resolvedAt: string;  // ISO-8601
  method: string;      // 교통수단 유형 기록 (향후 전환율 분석용 — TF-MTG-002)
}

type ResolvedGaps = Record<string, Record<string, ResolvedGapEntry>>;

interface GapStore {
  resolvedGaps: ResolvedGaps;

  /** Gap을 예약 완료로 표시한다 */
  resolveGap: (tripId: string, gapKey: string, method: string) => void;

  /** Gap의 예약 완료 표시를 해제한다 */
  unresolveGap: (tripId: string, gapKey: string) => void;

  /** 특정 Gap이 RESOLVED 상태인지 확인한다 */
  isResolved: (tripId: string, gapKey: string) => boolean;

  /** 특정 여행의 모든 RESOLVED gapKey 목록을 반환한다 */
  resolvedKeysForTrip: (tripId: string) => string[];
}

export const useGapStore = create<GapStore>()(
  persist(
    (set, get) => ({
      resolvedGaps: {},

      resolveGap: (tripId, gapKey, method) =>
        set((state) => ({
          resolvedGaps: {
            ...state.resolvedGaps,
            [tripId]: {
              ...(state.resolvedGaps[tripId] ?? {}),
              [gapKey]: {
                resolvedAt: new Date().toISOString(),
                method,
              },
            },
          },
        })),

      unresolveGap: (tripId, gapKey) =>
        set((state) => {
          const tripGaps = { ...(state.resolvedGaps[tripId] ?? {}) };
          delete tripGaps[gapKey];
          return {
            resolvedGaps: {
              ...state.resolvedGaps,
              [tripId]: tripGaps,
            },
          };
        }),

      isResolved: (tripId, gapKey) => {
        const { resolvedGaps } = get();
        return !!(resolvedGaps[tripId]?.[gapKey]);
      },

      resolvedKeysForTrip: (tripId) => {
        const { resolvedGaps } = get();
        return Object.keys(resolvedGaps[tripId] ?? {});
      },
    }),
    {
      name: 'tripframe-gap-resolved',
      storage: createJSONStorage(() => encryptedStorage),
    }
  )
);
