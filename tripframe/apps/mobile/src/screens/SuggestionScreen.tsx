import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTripStore } from '../store/useTripStore';
import { getMockTransportOptions, rankOptions } from '@tripframe/core';
import type { UserPreferences, Gap } from '@tripframe/core';
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

function PersonSelector({
  count,
  onChange,
}: {
  count: number;
  onChange: (n: number) => void;
}) {
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

interface GapSectionProps {
  gap: Gap;
  fromTitle: string;
  toTitle: string;
  isExpanded: boolean;
  onToggle: () => void;
  personCount: number;
}

function GapSection({
  gap,
  fromTitle,
  toTitle,
  isExpanded,
  onToggle,
  personCount,
}: GapSectionProps) {
  const isDanger = gap.severity === 'DANGER';
  const options = getMockTransportOptions(gap.id);
  const ranked = rankOptions(options, DEFAULT_PREFS);

  return (
    <View className="mb-4 rounded-xl border border-gray-800 overflow-hidden">
      {/* Gap 헤더 — 탭으로 토글 */}
      <TouchableOpacity
        onPress={onToggle}
        className="p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2 flex-1">
          <View className={`w-2 h-2 rounded-full ${isDanger ? 'bg-danger' : 'bg-warning'}`} />
          <Text className="text-white text-sm font-semibold flex-1" numberOfLines={1}>
            {fromTitle}
            <Text className="text-muted"> → </Text>
            {toTitle}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 ml-2">
          <View className={`px-2 py-0.5 rounded-full ${isDanger ? 'bg-danger/20' : 'bg-warning/20'}`}>
            <Text className={`text-xs font-medium ${isDanger ? 'text-danger' : 'text-warning'}`}>
              {isDanger ? 'DANGER' : 'WARNING'}
            </Text>
          </View>
          <Text className="text-muted text-sm">{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* 옵션 목록 — 토글에 따라 표시/숨김 */}
      {isExpanded && (
        <View className="border-t border-gray-800 px-4 pb-4 pt-3">
          {ranked.length === 0 ? (
            <Text className="text-muted text-sm">이동 수단 정보 없음</Text>
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
        </View>
      )}
    </View>
  );
}

export function SuggestionScreen() {
  const { allGaps, currentTrip } = useTripStore();
  const trip = currentTrip();
  const [personCount, setPersonCount] = useState(1);

  const dangerGaps = allGaps().filter((g) => g.severity === 'DANGER');

  // 독립 토글: 각 Gap ID를 key로 한 Set
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 기본 상태: 첫 DANGER Gap만 펼침
  useEffect(() => {
    if (dangerGaps.length > 0) {
      setExpandedIds(new Set([dangerGaps[0].id]));
    }
  }, [dangerGaps.length]);

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

  function getEventTitle(eventId: string): string {
    if (!trip) return eventId;
    for (const timeline of trip.timelines) {
      const event = timeline.events.find((e) => e.id === eventId);
      if (event) return event.title;
    }
    return eventId;
  }

  if (!trip || dangerGaps.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-success text-4xl mb-3">✓</Text>
        <Text className="text-white text-base font-medium">이동 수단 공백 없음</Text>
        <Text className="text-muted text-xs mt-1">모든 구간이 연결되었습니다</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header — 인원 선택 */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-muted text-xs">{trip?.title}</Text>
          <PersonSelector count={personCount} onChange={setPersonCount} />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-2">
        {dangerGaps.map((gap) => (
          <GapSection
            key={gap.id}
            gap={gap}
            fromTitle={getEventTitle(gap.fromEventId)}
            toTitle={getEventTitle(gap.toEventId)}
            isExpanded={expandedIds.has(gap.id)}
            onToggle={() => toggleGap(gap.id)}
            personCount={personCount}
          />
        ))}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
