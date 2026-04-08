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

function TripCard({ trip, onPress, onEdit, onExport }: TripCardProps) {
  const gapCount = trip.timelines.flatMap((t) => t.gaps).length;
  const dangerCount = trip.timelines
    .flatMap((t) => t.gaps)
    .filter((g) => g.severity === 'DANGER').length;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-card border border-gray-800 rounded-xl p-4 mb-3"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className="text-white text-base font-semibold mb-0.5">{trip.title}</Text>
          {trip.destination && (
            <Text className="text-primary text-xs mb-1">📍 {trip.destination}</Text>
          )}
          <Text className="text-muted text-xs">
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

      {gapCount > 0 && (
        <View className="flex-row items-center mt-2 gap-2">
          {dangerCount > 0 && (
            <View className="flex-row items-center bg-red-950/40 border border-danger/30 rounded-full px-2 py-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-danger mr-1" />
              <Text className="text-danger text-xs">위험 {dangerCount}개</Text>
            </View>
          )}
          {gapCount - dangerCount > 0 && (
            <View className="flex-row items-center bg-yellow-950/40 border border-warning/30 rounded-full px-2 py-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-warning mr-1" />
              <Text className="text-warning text-xs">경고 {gapCount - dangerCount}개</Text>
            </View>
          )}
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
        <Text className="text-white text-2xl font-bold mb-6">내 여행</Text>

        {/* 새 여행 만들기 카드 — 최상단 고정 */}
        <TouchableOpacity
          onPress={openCreate}
          className="bg-card border border-dashed border-primary/50 rounded-xl p-4 mb-4 items-center justify-center min-h-[72px]"
        >
          <Text className="text-primary text-base font-semibold">+ 새 여행 만들기</Text>
        </TouchableOpacity>

        {/* 여행 목록 */}
        {sortedTrips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onPress={() => onSelectTrip(trip.id)}
            onEdit={() => openEdit(trip)}
            onExport={() => setExportingTrip(trip)}
          />
        ))}

        {sortedTrips.length === 0 && (
          <Text className="text-muted text-center mt-12 text-sm">
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
