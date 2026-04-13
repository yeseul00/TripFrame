import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActionSheetIOS, Platform, Alert } from 'react-native';
import { useTripStore } from '../store/useTripStore';
import { TripFormModal } from './TripFormModal';
import { IcalExportModal } from '../components/IcalExportModal';
import type { Trip } from '@tripframe/core';

interface HomeScreenProps {
  onSelectTrip: (id: string) => void;
}

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  onEdit: () => void;
  onExport: () => void;
}

function getDDay(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function TripCard({ trip, onPress, onEdit, onExport }: TripCardProps) {
  const gapCount = trip.timelines.flatMap((t) => t.gaps).length;
  const dDay = getDDay(trip.startDate);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-card border border-gray-800 rounded-xl p-4 mb-3"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-white text-[15px] font-bold">{trip.title}</Text>
            <View className="bg-accent/20 border border-accent/30 rounded-md px-2 py-0.5">
              <Text className="text-accent text-[10px] font-bold">{dDay}</Text>
            </View>
          </View>
          <Text className="text-muted text-[11px]">
            {trip.startDate} ~ {trip.endDate}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'ios') {
              ActionSheetIOS.showActionSheetWithOptions(
                { options: ['취소', '편집', '내보내기 (.ics)'], cancelButtonIndex: 0 },
                (idx) => { if (idx === 1) onEdit(); if (idx === 2) onExport(); },
              );
            } else if (Platform.OS === 'web') {
              onEdit();
            } else {
              Alert.alert('여행 옵션', undefined, [
                { text: '편집', onPress: onEdit },
                { text: '내보내기 (.ics)', onPress: onExport },
                { text: '취소', style: 'cancel' },
              ]);
            }
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="p-1"
        >
          <Text className="text-muted text-sm">···</Text>
        </TouchableOpacity>
      </View>

      {gapCount > 0 ? (
        <View className="flex-row items-center mt-3 bg-orange-950/30 border border-warning-soft/20 rounded-xl px-3 py-2">
          <View className="w-1.5 h-1.5 rounded-full bg-warning-soft mr-2" />
          <Text className="text-warning-soft text-xs font-bold">
            확인 필요한 일정이 {gapCount}건 있어요
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center mt-3 bg-green-950/30 border border-success/20 rounded-xl px-3 py-2">
          <Text className="text-success text-xs font-bold">✓ 모든 일정이 준비되었어요</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function HomeScreen({ onSelectTrip }: HomeScreenProps) {
  const trips = useTripStore((state) => state.trips);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [exportingTrip, setExportingTrip] = useState<Trip | null>(null);

  // 출발일 역순 정렬 (최신 우선)
  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  function openCreate() {
    setEditingTrip(null);
    setShowForm(true);
  }

  function openEdit(trip: Trip) {
    setEditingTrip(trip);
    setShowForm(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-6">
        <Text className="text-white text-2xl font-bold mb-5">내 여행</Text>

        {/* 스마트 액션 카드 */}
        <View className="flex-row gap-3 mb-5">
          <TouchableOpacity className="flex-1 bg-card border border-gray-800 rounded-2xl p-4">
            <Text className="text-lg mb-2">📧</Text>
            <Text className="text-white text-[13px] font-bold mb-1">메일 연동하기</Text>
            <Text className="text-muted text-[10px]">예약 내역 자동 불러오기</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-card border border-gray-800 rounded-2xl p-4">
            <Text className="text-lg mb-2">📸</Text>
            <Text className="text-white text-[13px] font-bold mb-1">e-티켓 스캔</Text>
            <Text className="text-muted text-[10px]">이미지로 일정 추가하기</Text>
          </TouchableOpacity>
        </View>

        {/* 다가오는 여행 */}
        <View className="flex-row justify-between items-center mb-3 px-1">
          <Text className="text-white text-[15px] font-bold">다가오는 여행</Text>
        </View>

        {sortedTrips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onPress={() => onSelectTrip(trip.id)}
            onEdit={() => openEdit(trip)}
            onExport={() => setExportingTrip(trip)}
          />
        ))}

        {/* 새 여행 추가 (dashed border) */}
        <TouchableOpacity
          onPress={openCreate}
          className="border-2 border-dashed border-gray-700 rounded-2xl p-5 items-center justify-center mb-4"
        >
          <Text className="text-muted text-2xl mb-1">+</Text>
          <Text className="text-muted text-xs font-bold">직접 일정 추가하기</Text>
        </TouchableOpacity>

        {sortedTrips.length === 0 && (
          <Text className="text-muted text-center mt-8 text-sm">
            아직 여행이 없습니다.{'\n'}새 여행을 만들어 보세요.
          </Text>
        )}

        <View className="h-8" />
      </ScrollView>

      <TripFormModal
        visible={showForm}
        trip={editingTrip}
        onClose={() => setShowForm(false)}
      />

      {exportingTrip && (
        <IcalExportModal
          trip={exportingTrip}
          onClose={() => setExportingTrip(null)}
        />
      )}
    </SafeAreaView>
  );
}
