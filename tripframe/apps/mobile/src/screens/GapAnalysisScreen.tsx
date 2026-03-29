import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTripStore } from '../store/useTripStore';
import { useGapStore } from '../store/useGapStore';
import { calculateFreeTime, makeGapKey } from '@tripframe/core';
import type { Gap, FreeTimeResult, Trip } from '@tripframe/core';

interface GapCardProps {
  gap: Gap;
  tripId: string;
  dayIndex: number;
  fromLocation: string;
  toLocation: string;
}

function GapCard({ gap, tripId, dayIndex, fromLocation, toLocation }: GapCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDanger = gap.severity === 'DANGER';
  const gapKey = makeGapKey(fromLocation, toLocation, dayIndex);
  const isResolved = useGapStore((state) => state.isResolved(tripId, gapKey));
  const resolveGap = useGapStore((state) => state.resolveGap);
  const unresolveGap = useGapStore((state) => state.unresolveGap);

  if (isResolved) {
    // RESOLVED 카드: 초록 테두리 + ✓ 아이콘 (목록 하단 정렬은 부모에서 처리)
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

  return (
    <TouchableOpacity
      onPress={() => setIsOpen((prev) => !prev)}
      className={`mb-3 rounded-xl border ${isDanger ? 'border-danger/60 bg-red-950/20' : 'border-warning/60 bg-yellow-950/20'}`}
    >
      <View className="p-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <View className={`w-2 h-2 rounded-full ${isDanger ? 'bg-danger' : 'bg-warning'}`} />
            <Text className={`text-sm font-semibold ${isDanger ? 'text-danger' : 'text-warning'}`}>
              {isDanger ? '이동 수단 누락' : '여유 시간 부족'}
            </Text>
          </View>
          <Text className="text-gray-500 text-xs">{isOpen ? '▲' : '▼'}</Text>
        </View>
        <Text className="text-gray-400 text-xs mt-2">{gap.message}</Text>
      </View>

      {isOpen && gap.suggestions && gap.suggestions.length > 0 && (
        <View className="border-t border-gray-800 px-4 pb-3 pt-3">
          <Text className="text-gray-500 text-xs mb-2">선택 가능한 이동 수단</Text>
          {gap.suggestions.map((s, idx) => (
            <View key={idx} className="flex-row items-center mb-1.5">
              <View className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
              <Text className="text-gray-300 text-sm">{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 예약 완료 버튼 — 상시 노출 (AppState 자동 팝업 금지) */}
      <View className="border-t border-gray-800 px-4 pb-4 pt-3">
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            resolveGap(tripId, gapKey, isDanger ? 'DANGER_RESOLVED' : 'WARNING_RESOLVED');
          }}
          className="py-2 rounded-lg bg-primary/20 border border-primary/40 items-center"
        >
          <Text className="text-primary text-sm font-semibold">예약 완료</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function FreeTimeCard({ result }: { result: FreeTimeResult }) {
  const isWarning = result.minutes < 30;
  return (
    <View className={`mt-2 mb-3 p-4 rounded-xl border ${isWarning ? 'border-amber-500/50 bg-amber-950/20' : 'border-gray-700 bg-card'}`}>
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-base">⏳</Text>
        <Text className="text-white text-sm font-semibold">여유 시간</Text>
        <Text className={`text-xs font-bold ml-auto ${isWarning ? 'text-amber-400' : 'text-success'}`}>
          {result.minutes}분
        </Text>
      </View>
      <Text className="text-muted text-xs">
        {result.startTime} ~ {result.endTime}
      </Text>
      {(result.warning ?? result.suggestion) && (
        <Text className={`text-xs mt-2 ${isWarning ? 'text-amber-400' : 'text-gray-400'}`}>
          {result.warning ?? result.suggestion}
        </Text>
      )}
    </View>
  );
}

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

export function GapAnalysisScreen() {
  const { allGaps, currentTrip, currentTripId, selectedDayIndex } = useTripStore();
  const resolvedKeysForTrip = useGapStore((state) => state.resolvedKeysForTrip);
  const trip = currentTrip();
  const tripId = currentTripId ?? '';
  const gaps = allGaps();

  const resolvedKeys = trip ? resolvedKeysForTrip(tripId) : [];
  const unresolvedGaps = gaps.filter(
    (g) => !resolvedKeys.includes(makeGapKey(
      getLocationForEvent(trip!, g.fromEventId),
      getLocationForEvent(trip!, g.toEventId),
      getDayIndexForGap(trip!, g.id),
    ))
  );
  const resolvedGaps = gaps.filter(
    (g) => resolvedKeys.includes(makeGapKey(
      getLocationForEvent(trip!, g.fromEventId),
      getLocationForEvent(trip!, g.toEventId),
      getDayIndexForGap(trip!, g.id),
    ))
  );
  const dangerCount = unresolvedGaps.filter((g) => g.severity === 'DANGER').length;

  if (!trip) return null;

  // 선택된 Day에서 도착 이벤트 + 호텔 체크인으로 여유 시간 계산
  const timeline = trip.timelines[selectedDayIndex];
  const arrivalEvent = timeline?.events.find((e) => e.type === 'flight' && e.location);
  const hotelEvent = timeline?.events.find((e) => e.type === 'hotel');
  const freeTime =
    arrivalEvent && hotelEvent
      ? calculateFreeTime(arrivalEvent.time, hotelEvent.time)
      : null;

  function renderGapCard(gap: Gap) {
    const fromLocation = getLocationForEvent(trip!, gap.fromEventId);
    const toLocation = getLocationForEvent(trip!, gap.toEventId);
    const dayIndex = getDayIndexForGap(trip!, gap.id);
    return (
      <GapCard
        key={gap.id}
        gap={gap}
        tripId={tripId}
        dayIndex={dayIndex}
        fromLocation={fromLocation}
        toLocation={toLocation}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Summary header padding */}
      <View className="px-4 pt-4 pb-1" />

      {/* Summary */}
      <View className="mx-4 mb-4 p-4 rounded-xl bg-card">
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-danger text-2xl font-bold">{dangerCount}</Text>
            <Text className="text-gray-500 text-xs mt-1">위험 공백</Text>
          </View>
          <View className="w-px bg-gray-800" />
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">{unresolvedGaps.length}</Text>
            <Text className="text-gray-500 text-xs mt-1">미해결 공백</Text>
          </View>
          <View className="w-px bg-gray-800" />
          <View className="items-center">
            <Text className="text-success text-2xl font-bold">{resolvedGaps.length}</Text>
            <Text className="text-gray-500 text-xs mt-1">예약 완료</Text>
          </View>
        </View>
      </View>

      {/* Gap list: 미해결 상단 → RESOLVED 하단 정렬 */}
      <ScrollView className="flex-1 px-4">
        {gaps.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-success text-4xl mb-3">✓</Text>
            <Text className="text-white text-base font-medium">모든 구간이 연결되었습니다</Text>
            <Text className="text-gray-500 text-xs mt-1">이동 수단 공백 없음</Text>
          </View>
        ) : (
          <>
            {unresolvedGaps.map(renderGapCard)}
            {resolvedGaps.length > 0 && (
              <>
                <View className="my-2 border-t border-gray-800" />
                <Text className="text-gray-600 text-xs mb-2">예약 완료</Text>
                {resolvedGaps.map(renderGapCard)}
              </>
            )}
          </>
        )}

        {/* 여유 시간 카드 (도착→체크인 구간이 있는 경우) */}
        {freeTime !== null && <FreeTimeCard result={freeTime} />}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
