import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { TransportOption } from '@tripframe/core';

const MODE_LABEL: Record<TransportOption['mode'], string> = {
  PUBLIC: '대중교통',
  TAXI: '택시',
  RENTAL: '렌터카',
};

const MODE_COLOR: Record<TransportOption['mode'], string> = {
  PUBLIC: 'text-blue-400',
  TAXI: 'text-yellow-400',
  RENTAL: 'text-green-400',
};

interface OptionCardProps {
  option: TransportOption;
  personCount: number;
  isRecommended: boolean;
}

export function OptionCard({ option, personCount, isRecommended }: OptionCardProps) {
  const totalPrice = option.pricePerPerson * personCount;

  async function handleBook() {
    if (!option.bookingUrl) return;
    await WebBrowser.openBrowserAsync(option.bookingUrl);
  }

  return (
    <View
      className={`mb-3 rounded-xl border ${
        isRecommended ? 'border-primary bg-primary/10' : 'border-gray-800 bg-card'
      }`}
    >
      <View className="p-4">
        {/* 추천 배지 */}
        {isRecommended && (
          <View className="bg-primary rounded-md px-2 py-0.5 self-start mb-2">
            <Text className="text-white text-xs font-semibold">추천</Text>
          </View>
        )}

        {/* 모드 + 라벨 */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className={`text-xs font-medium mb-0.5 ${MODE_COLOR[option.mode]}`}>
              {MODE_LABEL[option.mode]}
            </Text>
            <Text className="text-white font-semibold text-sm">{option.label}</Text>
          </View>

          {/* 소요시간 */}
          <View className="items-end">
            <Text className="text-muted text-xs">소요</Text>
            <Text className="text-white font-bold">{option.durationMinutes}분</Text>
          </View>
        </View>

        {/* 요금 */}
        <View className="flex-row items-baseline justify-between mt-1">
          <Text className="text-muted text-xs">
            1인 {option.pricePerPerson.toLocaleString()}원
            {personCount > 1 && ` × ${personCount}명`}
          </Text>
          <Text className="text-white text-base font-bold">
            {totalPrice.toLocaleString()}원
          </Text>
        </View>

        {/* 비고 */}
        {option.notes && (
          <Text className="text-muted text-xs mt-2">{option.notes}</Text>
        )}

        {/* 예약 버튼 */}
        {option.bookingUrl && (
          <TouchableOpacity
            onPress={handleBook}
            className="mt-3 py-2 rounded-lg bg-gray-800 items-center"
          >
            <Text className="text-primary text-sm font-medium">
              {option.requiresBooking ? '예약하기 (필수)' : '예약하기'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
