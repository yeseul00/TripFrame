import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTripStore } from '../store/useTripStore';
import { getMockTransportOptions, rankOptions } from '@tripframe/core';
import type { UserPreferences } from '@tripframe/core';
import { OptionCard } from '../components/OptionCard';

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

export function SuggestionScreen() {
  const { allGaps, trip } = useTripStore();
  const [personCount, setPersonCount] = useState(1);

  const dangerGaps = allGaps().filter((g) => g.severity === 'DANGER');

  function getEventTitle(eventId: string): string {
    for (const timeline of trip.timelines) {
      const event = timeline.events.find((e) => e.id === eventId);
      if (event) return event.title;
    }
    return eventId;
  }

  if (dangerGaps.length === 0) {
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
      {/* Header */}
      <View className="px-4 pt-12 pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xl font-bold">이동 수단 제안</Text>
            <Text className="text-muted text-xs mt-0.5">{trip.title}</Text>
          </View>
          <PersonSelector count={personCount} onChange={setPersonCount} />
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        {dangerGaps.map((gap) => {
          const options = getMockTransportOptions(gap.id);
          const ranked = rankOptions(options, DEFAULT_PREFS);

          return (
            <View key={gap.id} className="mb-8">
              {/* 구간 헤더 */}
              <View className="flex-row items-center mb-3 gap-2">
                <View className="w-2 h-2 rounded-full bg-danger" />
                <Text className="text-white text-sm font-semibold">
                  {getEventTitle(gap.fromEventId)}
                  <Text className="text-muted"> → </Text>
                  {getEventTitle(gap.toEventId)}
                </Text>
              </View>

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
          );
        })}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
