import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTripStore } from '../store/useTripStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  ReverseCalcStep,
  calculateReverseTime,
  calculateFreeTime,
  recalculateWithAlternative,
  applyBufferLevel,
} from '@tripframe/core';

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

// 대안 교통수단 목 데이터 (transport 단계에 대한 예시)
const ALT_TRANSPORT_OPTIONS: ReverseCalcStep[] = [
  { id: 'alt-bus', label: '고속버스 (75분)', durationMinutes: 75, type: 'transport' },
  { id: 'alt-train', label: '공항철도 (55분)', durationMinutes: 55, type: 'transport' },
  { id: 'alt-taxi', label: '택시 (45분)', durationMinutes: 45, type: 'transport' },
  { id: 'alt-limousine', label: '리무진 버스 (90분)', durationMinutes: 90, type: 'transport' },
];

export function ReverseCalcDetailScreen() {
  const { reverseCalc, currentTrip } = useTripStore();
  const { settings } = useSettingsStore();
  const trip = currentTrip();

  // Day 선택 상태 (로컬)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // 대안 교통수단 토글
  const [showAltSection, setShowAltSection] = useState(false);
  const [selectedAltId, setSelectedAltId] = useState<string | null>(null);

  if (!trip) return null;

  // 빈 일정: 이벤트 없음
  if (trip.timelines.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6 pb-20">
        <Text className="text-4xl mb-4">⏱</Text>
        <Text className="text-white text-base font-semibold mb-2">역산 데이터 없음</Text>
        <Text className="text-gray-500 text-sm text-center">
          일정 탭에서 비행편이나 호텔을{'\n'}추가하면 역산 결과가 표시됩니다.
        </Text>
      </View>
    );
  }

  const timeline = trip.timelines[selectedDayIndex];

  // 해당 Day의 앵커 이벤트 (가장 이른 항공편 → 없으면 첫 호텔)
  const anchorEvent =
    timeline?.events.find((e) => e.type === 'flight') ??
    timeline?.events.find((e) => e.type === 'hotel') ??
    null;

  // Day별 역산: anchorEvent가 있으면 해당 시각으로, 없으면 store의 reverseCalc 사용
  const anchorTime = anchorEvent?.time ?? reverseCalc.anchorTime;
  const steps = applyBufferLevel(reverseCalc.steps, settings.bufferLevel);
  const calculatedTime = calculateReverseTime(anchorTime, steps);

  // 자유 시간 계산 (해당 Day에 항공편 도착 + 호텔 체크인이 모두 있는 경우)
  const flightArrival = timeline?.events.find(
    (e) => e.type === 'flight' && e.location
  );
  const hotelCheckIn = timeline?.events.find((e) => e.type === 'hotel');
  const freeTime =
    flightArrival && hotelCheckIn
      ? calculateFreeTime(flightArrival.time, hotelCheckIn.time)
      : null;

  // 대안 교통수단 탭의 transport 단계 찾기
  const transportStep = steps.find((s) => s.type === 'transport') ?? null;

  // 선택한 대안으로 역산
  const selectedAlt = ALT_TRANSPORT_OPTIONS.find((a) => a.id === selectedAltId) ?? null;
  const altResult =
    selectedAlt && transportStep
      ? recalculateWithAlternative(anchorTime, steps, transportStep.id, selectedAlt)
      : null;

  return (
    <View className="flex-1 bg-background">
      {/* Subtitle */}
      <View className="px-4 pt-4 pb-3">
        <Text className="text-gray-500 text-xs">집을 몇 시에 나서야 할까?</Text>
      </View>

      {/* Day 선택 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-4"
        style={{ flexGrow: 0 }}
      >
        {trip.timelines.map((t, idx) => {
          const isActive = idx === selectedDayIndex;
          return (
            <TouchableOpacity
              key={t.day}
              onPress={() => {
                setSelectedDayIndex(idx);
                setShowAltSection(false);
                setSelectedAltId(null);
              }}
              className={`mr-2 px-4 py-2 rounded-full border ${
                isActive ? 'bg-primary border-primary' : 'border-gray-700 bg-card'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  isActive ? 'text-background' : 'text-gray-400'
                }`}
              >
                Day {t.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView className="flex-1 px-4">
        {/* Anchor card */}
        <View className="mb-4 p-4 rounded-xl bg-card border border-primary/30">
          <Text className="text-primary text-xs font-medium mb-1">앵커 이벤트 (기준 시각)</Text>
          <Text className="text-white text-base font-semibold">
            ✈ {anchorEvent?.title ?? '출발 항공편'}
          </Text>
          <Text className="text-primary text-3xl font-bold mt-2">{anchorTime}</Text>
          <Text className="text-gray-500 text-xs mt-1">출발 예정</Text>
        </View>

        {/* Steps */}
        <Text className="text-gray-500 text-xs mb-3 px-1">역산 단계</Text>
        {steps.map((step, idx) => (
          <View key={step.id} className="flex-row mb-3">
            <View className="items-center w-8 mr-3">
              <View className="w-2 h-2 rounded-full bg-gray-600 mt-1" />
              {idx < steps.length - 1 && (
                <View className="w-0.5 flex-1 bg-gray-800 mt-1" />
              )}
            </View>

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
          <Text className="text-white text-4xl font-bold">{calculatedTime}</Text>
          <Text className="text-gray-400 text-xs mt-2">
            총 {steps.reduce((acc, s) => acc + s.durationMinutes, 0)}분 전 출발
          </Text>
        </View>

        {/* 자유 시간 카드 */}
        {freeTime && freeTime.minutes > 0 && (
          <View className="mt-4 p-4 rounded-xl bg-card border border-gray-800">
            <Text className="text-primary text-xs font-medium mb-2">✨ 자유 시간</Text>
            <Text className="text-white text-2xl font-bold mb-1">
              {freeTime.minutes >= 60
                ? `${Math.floor(freeTime.minutes / 60)}시간 ${freeTime.minutes % 60}분`
                : `${freeTime.minutes}분`}
            </Text>
            <Text className="text-gray-500 text-xs mb-3">
              {freeTime.startTime} ~ {freeTime.endTime}
            </Text>
            {freeTime.warning && (
              <View className="bg-warning/10 border border-warning/30 rounded-lg p-2">
                <Text className="text-warning text-xs">⚠ {freeTime.warning}</Text>
              </View>
            )}
            {freeTime.suggestion && (
              <Text className="text-gray-400 text-xs leading-relaxed">{freeTime.suggestion}</Text>
            )}
          </View>
        )}

        {/* 대안 교통수단 비교 */}
        {transportStep && (
          <View className="mt-4 mb-4">
            <TouchableOpacity
              onPress={() => setShowAltSection((prev) => !prev)}
              className="flex-row justify-between items-center p-4 bg-card rounded-xl border border-gray-800"
            >
              <Text className="text-white text-sm font-medium">다른 교통수단으로 계산</Text>
              <Text className="text-muted text-sm">{showAltSection ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showAltSection && (
              <View className="mt-2 border border-gray-800 rounded-xl overflow-hidden">
                {ALT_TRANSPORT_OPTIONS.map((alt) => {
                  const isSelected = selectedAltId === alt.id;
                  const preview = recalculateWithAlternative(anchorTime, steps, transportStep.id, alt);
                  const delta = preview.deltaMinutes;

                  return (
                    <TouchableOpacity
                      key={alt.id}
                      onPress={() => setSelectedAltId(isSelected ? null : alt.id)}
                      className={`p-4 border-b border-gray-800 flex-row justify-between items-center ${
                        isSelected ? 'bg-primary/10' : 'bg-card'
                      }`}
                    >
                      <View>
                        <Text className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-white'}`}>
                          {alt.label}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-0.5">
                          출발 {preview.calculatedTime}
                        </Text>
                      </View>
                      <View className="items-end">
                        {delta !== 0 && (
                          <View className={`px-2 py-0.5 rounded-full ${delta > 0 ? 'bg-danger/20' : 'bg-success/20'}`}>
                            <Text className={`text-xs font-medium ${delta > 0 ? 'text-danger' : 'text-success'}`}>
                              {delta > 0 ? `${delta}분 앞당겨짐` : `${Math.abs(delta)}분 늦출 수 있음`}
                            </Text>
                          </View>
                        )}
                        {delta === 0 && (
                          <Text className="text-gray-500 text-xs">변화 없음</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {altResult && (
                  <View className="p-4 bg-primary/5">
                    <Text className="text-primary text-xs font-medium mb-1">
                      선택: {altResult.alternativeStep.label}
                    </Text>
                    <Text className="text-white text-2xl font-bold">{altResult.calculatedTime}</Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      기준 대비{' '}
                      {altResult.deltaMinutes > 0
                        ? `${altResult.deltaMinutes}분 일찍 출발 필요`
                        : altResult.deltaMinutes < 0
                        ? `${Math.abs(altResult.deltaMinutes)}분 늦게 출발 가능`
                        : '동일한 출발 시각'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Breakdown */}
        <View className="mt-2 mb-4 p-4 rounded-xl bg-card">
          <Text className="text-gray-500 text-xs mb-3">단계별 소요 시간</Text>
          {steps.map((step) => (
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
              {steps.reduce((acc, s) => acc + s.durationMinutes, 0)}분
            </Text>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
