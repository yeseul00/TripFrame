import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTripStore } from '../store/useTripStore';
import { ReverseCalcStep } from '@tripframe/core';

const STEP_ICONS: Record<ReverseCalcStep['type'], string> = {
  checkin: '✈',
  transport: '🚌',
  buffer: '⏱',
  prep: '🎒',
};

const STEP_COLORS: Record<ReverseCalcStep['type'], string> = {
  checkin: 'text-primary',
  transport: 'text-blue-400',
  buffer: 'text-warning',
  prep: 'text-success',
};

export function ReverseCalcDetailScreen() {
  const { reverseCalc, trip } = useTripStore();
  const flightEvent = trip.timelines[0].events.find((e) => e.type === 'flight');

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-12 pb-4">
        <Text className="text-white text-xl font-bold">역산 타임라인</Text>
        <Text className="text-gray-500 text-xs mt-1">집을 몇 시에 나서야 할까?</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Anchor card */}
        <View className="mb-4 p-4 rounded-xl bg-card border border-primary/30">
          <Text className="text-primary text-xs font-medium mb-1">앵커 이벤트 (기준 시각)</Text>
          <Text className="text-white text-base font-semibold">
            ✈ {flightEvent?.title ?? '출발 항공편'}
          </Text>
          <Text className="text-primary text-3xl font-bold mt-2">{reverseCalc.anchorTime}</Text>
          <Text className="text-gray-500 text-xs mt-1">출발 예정</Text>
        </View>

        {/* Steps */}
        <Text className="text-gray-500 text-xs mb-3 px-1">역산 단계</Text>
        {reverseCalc.steps.map((step, idx) => (
          <View key={step.id} className="flex-row mb-3">
            {/* Line */}
            <View className="items-center w-8 mr-3">
              <View className="w-2 h-2 rounded-full bg-gray-600 mt-1" />
              {idx < reverseCalc.steps.length - 1 && (
                <View className="w-0.5 flex-1 bg-gray-800 mt-1" />
              )}
            </View>

            {/* Step card */}
            <View className="flex-1 p-3 rounded-lg bg-card mb-0.5">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <Text className={`text-base ${STEP_COLORS[step.type]}`}>
                    {STEP_ICONS[step.type]}
                  </Text>
                  <Text className="text-white text-sm">{step.label}</Text>
                </View>
                <Text className="text-gray-400 text-xs">−{step.durationMinutes}분</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Result card */}
        <View className="mt-2 p-4 rounded-xl bg-primary/10 border border-primary/40">
          <Text className="text-primary text-xs font-medium mb-1">권장 집 출발 시각</Text>
          <Text className="text-white text-4xl font-bold">{reverseCalc.calculatedTime}</Text>
          <Text className="text-gray-400 text-xs mt-2">
            총 {reverseCalc.steps.reduce((acc, s) => acc + s.durationMinutes, 0)}분 전 출발
          </Text>
        </View>

        {/* Breakdown */}
        <View className="mt-4 p-4 rounded-xl bg-card">
          <Text className="text-gray-500 text-xs mb-3">단계별 소요 시간</Text>
          {reverseCalc.steps.map((step) => (
            <View key={step.id} className="flex-row justify-between mb-2">
              <Text className={`text-xs ${STEP_COLORS[step.type]}`}>
                {STEP_ICONS[step.type]} {step.label}
              </Text>
              <Text className="text-gray-400 text-xs">{step.durationMinutes}분</Text>
            </View>
          ))}
          <View className="border-t border-gray-800 mt-2 pt-2 flex-row justify-between">
            <Text className="text-gray-300 text-xs font-medium">합계</Text>
            <Text className="text-white text-xs font-bold">
              {reverseCalc.steps.reduce((acc, s) => acc + s.durationMinutes, 0)}분
            </Text>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
