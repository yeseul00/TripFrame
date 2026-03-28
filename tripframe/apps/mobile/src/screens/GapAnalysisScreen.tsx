import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTripStore } from '../store/useTripStore';
import { Gap } from '@tripframe/core';

function GapCard({ gap }: { gap: Gap }) {
  const [isOpen, setIsOpen] = useState(false);
  const isDanger = gap.severity === 'DANGER';

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
        <View className="border-t border-gray-800 px-4 pb-4 pt-3">
          <Text className="text-gray-500 text-xs mb-2">선택 가능한 이동 수단</Text>
          {gap.suggestions.map((s, idx) => (
            <View key={idx} className="flex-row items-center mb-1.5">
              <View className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
              <Text className="text-gray-300 text-sm">{s}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function GapAnalysisScreen() {
  const { allGaps, currentTrip } = useTripStore();
  const trip = currentTrip();
  const gaps = allGaps();
  const dangerCount = gaps.filter((g) => g.severity === 'DANGER').length;

  if (!trip) return null;

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
            <Text className="text-white text-2xl font-bold">{gaps.length}</Text>
            <Text className="text-gray-500 text-xs mt-1">총 공백</Text>
          </View>
          <View className="w-px bg-gray-800" />
          <View className="items-center">
            <Text className="text-success text-2xl font-bold">
              {trip.timelines.length - gaps.length > 0 ? trip.timelines.length - gaps.length : 0}
            </Text>
            <Text className="text-gray-500 text-xs mt-1">완성 구간</Text>
          </View>
        </View>
      </View>

      {/* Gap list */}
      <ScrollView className="flex-1 px-4">
        {gaps.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-success text-4xl mb-3">✓</Text>
            <Text className="text-white text-base font-medium">모든 구간이 연결되었습니다</Text>
            <Text className="text-gray-500 text-xs mt-1">이동 수단 공백 없음</Text>
          </View>
        ) : (
          gaps.map((gap) => <GapCard key={gap.id} gap={gap} />)
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
