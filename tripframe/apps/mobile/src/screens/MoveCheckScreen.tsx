/**
 * MoveCheckScreen — 스마트 체크 탭
 *
 * 공백감지 + 제안카드 통합. Gap 카드 탭 → 교통 옵션 인라인 펼침 + "예약 완료" 버튼.
 * RESOLVED 카드는 목록 하단 정렬.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTripStore } from '../store/useTripStore';
import { useGapStore } from '../store/useGapStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { getMockTransportOptions, rankOptions, sortByPreference, makeGapKey } from '@tripframe/core';
import type { Gap, Trip } from '@tripframe/core';
import type { UserPreferences } from '@tripframe/core';
import { OptionCard } from '../components/OptionCard';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEFAULT_PREFS: UserPreferences = {
  transportPreference: 'ANY',
  luggageSize: 'CARRY_ON',
  timeBuffer: 'RELAXED',
};

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function getLocationForEvent(trip: Trip, eventId: string): string {
  for (const tl of trip.timelines) {
    const ev = tl.events.find((e) => e.id === eventId);
    if (ev?.location) return ev.location;
  }
  return '';
}

function getDayIndexForGap(trip: Trip, gapId: string): number {
  for (let i = 0; i < trip.timelines.length; i++) {
    if (trip.timelines[i].gaps.some((g) => g.id === gapId)) return i;
  }
  return 0;
}

function getEventTitle(trip: Trip, eventId: string): string {
  for (const tl of trip.timelines) {
    const ev = tl.events.find((e) => e.id === eventId);
    if (ev) return ev.title;
  }
  return eventId;
}

// ─── 인원 선택 ──────────────────────────────────────────────────────────────

function PersonSelector({ count, onChange }: { count: number; onChange: (n: number) => void }) {
  return (
    <View className="flex-row items-center gap-3">
      <Text className="text-muted text-sm">인원</Text>
      <TouchableOpacity
        onPress={() => onChange(Math.max(1, count - 1))}
        className="w-7 h-7 rounded-full bg-gray-800 items-center justify-center"
      >
        <Text className="text-white font-bold">−</Text>
      </TouchableOpacity>
      <Text className="text-white font-bold text-base w-4 text-center">{count}</Text>
      <TouchableOpacity
        onPress={() => onChange(Math.min(9, count + 1))}
        className="w-7 h-7 rounded-full bg-gray-800 items-center justify-center"
      >
        <Text className="text-white font-bold">+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Gap 카드 (RESOLVED 버전) ────────────────────────────────────────────────

function ResolvedGapCard({ gap, tripId, gapKey }: { gap: Gap; tripId: string; gapKey: string }) {
  const unresolveGap = useGapStore((state) => state.unresolveGap);
  return (
    <View className="mb-3 rounded-xl border border-success/60 bg-green-950/20">
      <View className="p-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-success text-base">✓</Text>
          <Text className="text-success text-sm font-semibold">예약 완료</Text>
        </View>
        <TouchableOpacity
          onPress={() => unresolveGap(tripId, gapKey)}
          className="px-2 py-1 rounded bg-gray-800"
        >
          <Text className="text-gray-400 text-xs">취소</Text>
        </TouchableOpacity>
      </View>
      <View className="px-4 pb-3">
        <Text className="text-gray-500 text-xs">{gap.message}</Text>
      </View>
    </View>
  );
}

// ─── Gap 카드 (미해결 + 교통 옵션 인라인) ──────────────────────────────────

interface GapCardWithOptionsProps {
  gap: Gap;
  tripId: string;
  gapKey: string;
  fromTitle: string;
  toTitle: string;
  isExpanded: boolean;
  onToggle: () => void;
  personCount: number;
  transportPreference: import('../store/useSettingsStore').TransportPreference;
}

function GapCardWithOptions({
  gap,
  tripId,
  gapKey,
  fromTitle,
  toTitle,
  isExpanded,
  onToggle,
  personCount,
  transportPreference,
}: GapCardWithOptionsProps) {
  const isDanger = gap.severity === 'DANGER';
  const resolveGap = useGapStore((state) => state.resolveGap);
  const options = getMockTransportOptions(gap.id);
  const ranked = sortByPreference(rankOptions(options, DEFAULT_PREFS), transportPreference);

  return (
    <View className={`mb-4 rounded-xl border border-warning-soft/30 overflow-hidden`}>
      {/* Gap 헤더 — 탭으로 토글 */}
      <TouchableOpacity
        onPress={onToggle}
        className="p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-2 h-2 rounded-full bg-warning-soft" />
          <Text className="text-white text-sm font-semibold flex-1" numberOfLines={1}>
            {fromTitle}
            <Text className="text-muted"> → </Text>
            {toTitle}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 ml-2">
          <View className="px-2 py-0.5 rounded-full bg-warning-soft/20">
            <Text className="text-warning-soft text-xs font-medium">
              확인 필요
            </Text>
          </View>
          <Text className="text-muted text-sm">{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* 교통 옵션 + 예약 완료 버튼 — 인라인 펼침 */}
      {isExpanded && (
        <View className="border-t border-gray-800 px-4 pb-4 pt-3">
          {ranked.length === 0 ? (
            <Text className="text-muted text-sm mb-3">이동 수단 정보 없음</Text>
          ) : (
            ranked.map((opt, idx) => (
              <OptionCard
                key={opt.id}
                option={opt}
                personCount={personCount}
                isRecommended={idx === 0}
              />
            ))
          )}
          {/* 예약 완료 버튼 — 상시 노출 (AppState 자동 팝업 금지) */}
          <TouchableOpacity
            onPress={() => resolveGap(tripId, gapKey, isDanger ? 'DANGER_RESOLVED' : 'WARNING_RESOLVED')}
            className="mt-1 py-2.5 rounded-lg bg-primary/20 border border-primary/40 items-center"
          >
            <Text className="text-primary text-sm font-semibold">예약 완료</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────────────────────────

export function MoveCheckScreen() {
  const { allGaps, currentTrip, currentTripId, openGapKey, setOpenGapKey } = useTripStore();
  const { settings } = useSettingsStore();
  const resolvedKeysForTrip = useGapStore((state) => state.resolvedKeysForTrip);
  const isResolved = useGapStore((state) => state.isResolved);

  const trip = currentTrip();
  const tripId = currentTripId ?? '';
  const gaps = allGaps();
  const [personCount, setPersonCount] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 딥링크: openGapKey가 있으면 해당 Gap ID 자동 펼침
  useEffect(() => {
    if (!openGapKey || !trip) return;
    // gapKey → gap ID 역방향 조회
    for (const gap of gaps) {
      const fromLoc = getLocationForEvent(trip, gap.fromEventId);
      const toLoc = getLocationForEvent(trip, gap.toEventId);
      const dayIdx = getDayIndexForGap(trip, gap.id);
      if (makeGapKey(fromLoc, toLoc, dayIdx) === openGapKey) {
        setExpandedIds(new Set([gap.id]));
        break;
      }
    }
    setOpenGapKey(null); // 소비 후 초기화
  }, [openGapKey]);

  // 기본 상태: 첫 DANGER Gap만 펼침 (딥링크 없을 때)
  useEffect(() => {
    if (openGapKey) return;
    const firstDanger = gaps.find((g) => g.severity === 'DANGER');
    if (firstDanger) {
      setExpandedIds(new Set([firstDanger.id]));
    }
  }, [gaps.length]);

  function toggleGap(gapId: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gapId)) {
        next.delete(gapId);
      } else {
        next.add(gapId);
      }
      return next;
    });
  }

  if (!trip || gaps.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-success text-4xl mb-3">✓</Text>
        <Text className="text-white text-base font-medium">이동 수단 공백 없음</Text>
        <Text className="text-muted text-xs mt-1">모든 구간이 연결되었습니다</Text>
      </View>
    );
  }

  const resolvedKeys = resolvedKeysForTrip(tripId);

  const unresolvedGaps = gaps.filter((g) => {
    const fromLoc = getLocationForEvent(trip, g.fromEventId);
    const toLoc = getLocationForEvent(trip, g.toEventId);
    const dayIdx = getDayIndexForGap(trip, g.id);
    return !isResolved(tripId, makeGapKey(fromLoc, toLoc, dayIdx));
  });

  const resolvedGaps = gaps.filter((g) => {
    const fromLoc = getLocationForEvent(trip, g.fromEventId);
    const toLoc = getLocationForEvent(trip, g.toEventId);
    const dayIdx = getDayIndexForGap(trip, g.id);
    return isResolved(tripId, makeGapKey(fromLoc, toLoc, dayIdx));
  });

  return (
    <View className="flex-1 bg-background">
      {/* 헤더 — 인원 선택 */}
      <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
        <Text className="text-muted text-xs">
          미해결 {unresolvedGaps.length}건 · 완료 {resolvedGaps.length}건
        </Text>
        <PersonSelector count={personCount} onChange={setPersonCount} />
      </View>

      <ScrollView className="flex-1 px-4 pt-2">
        {/* 미해결 Gap 목록 (DANGER/WARNING 상단) */}
        {unresolvedGaps.map((gap) => {
          const fromLoc = getLocationForEvent(trip, gap.fromEventId);
          const toLoc = getLocationForEvent(trip, gap.toEventId);
          const dayIdx = getDayIndexForGap(trip, gap.id);
          const gapKey = makeGapKey(fromLoc, toLoc, dayIdx);
          return (
            <GapCardWithOptions
              key={gap.id}
              gap={gap}
              tripId={tripId}
              gapKey={gapKey}
              fromTitle={getEventTitle(trip, gap.fromEventId)}
              toTitle={getEventTitle(trip, gap.toEventId)}
              isExpanded={expandedIds.has(gap.id)}
              onToggle={() => toggleGap(gap.id)}
              personCount={personCount}
              transportPreference={settings.transportPreference}
            />
          );
        })}

        {/* RESOLVED 카드 하단 */}
        {resolvedGaps.length > 0 && (
          <>
            <View className="my-2 border-t border-gray-800" />
            <Text className="text-gray-600 text-xs mb-2">예약 완료</Text>
            {resolvedGaps.map((gap) => {
              const fromLoc = getLocationForEvent(trip, gap.fromEventId);
              const toLoc = getLocationForEvent(trip, gap.toEventId);
              const dayIdx = getDayIndexForGap(trip, gap.id);
              const gapKey = makeGapKey(fromLoc, toLoc, dayIdx);
              return (
                <ResolvedGapCard
                  key={gap.id}
                  gap={gap}
                  tripId={tripId}
                  gapKey={gapKey}
                />
              );
            })}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
