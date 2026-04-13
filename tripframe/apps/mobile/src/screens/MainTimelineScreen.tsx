import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTripStore } from '../store/useTripStore';
import { EventFormModal } from './EventFormModal';
import { TripEvent, EventType } from '@tripframe/core';

const EVENT_ICONS: Record<EventType, string> = {
  flight: '✈',
  hotel: '🏨',
  transport: '🚌',
  home: '🏠',
  warning: '⚠',
  free: '☀',
  prep: '📦',
  activity: '📍',
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

/** 지도 플레이스홀더 — 추후 MapView로 교체 */
function MapPlaceholder({ tripTitle }: { tripTitle: string }) {
  return (
    <View
      className="bg-gray-900 border-b border-gray-800 items-center justify-center"
      style={{ height: SCREEN_HEIGHT * 0.28 }}
    >
      {/* 헤더 오버레이 */}
      <View className="absolute top-12 left-4 right-4 flex-row justify-between items-start z-10">
        <View className="bg-card/80 px-3 py-1.5 rounded-xl">
          <Text className="text-white text-lg font-bold">{tripTitle}</Text>
        </View>
      </View>
      {/* 지도 아이콘 */}
      <Text className="text-4xl mb-2 opacity-30">🗺️</Text>
      <Text className="text-muted text-xs opacity-50">지도 준비 중</Text>
    </View>
  );
}

function EventItem({
  event,
  isLast,
  onEdit,
  onOpenCalc,
}: {
  event: TripEvent;
  isLast: boolean;
  onEdit: () => void;
  onOpenCalc: () => void;
}) {
  const isMissing = event.status === 'missing';
  const isDerived = event.isDerived;
  const isTransport = event.type === 'transport';
  const isAuto = event.status === 'auto';

  // Transport/missing 이벤트 — 칩 스타일
  if (isTransport || isMissing) {
    return (
      <View className="flex-row">
        <View className="items-center w-8 mr-3">
          <View className={`w-2 h-2 rounded-full mt-2 ${
            isMissing ? 'bg-warning-soft' : isAuto ? 'bg-success' : 'bg-gray-500'
          }`} />
          {!isLast && <View className="w-0.5 flex-1 bg-gray-800 mt-1" />}
        </View>
        <TouchableOpacity
          onPress={isMissing ? onOpenCalc : onEdit}
          className={`flex-1 mb-2 px-3 py-2 rounded-xl flex-row items-center justify-between ${
            isMissing
              ? 'bg-orange-950/30 border border-warning-soft/30'
              : isAuto
                ? 'bg-green-950/30 border border-success/30'
                : 'bg-card border border-gray-800'
          }`}
        >
          <View className="flex-row items-center gap-2 flex-1">
            <Text className="text-sm">{EVENT_ICONS[event.type]}</Text>
            <View className="flex-1">
              <Text className={`text-xs font-medium ${isMissing ? 'text-warning-soft' : 'text-gray-300'}`}>
                {event.title}
              </Text>
              {event.sub && <Text className="text-gray-500 text-[10px]">{event.sub}</Text>}
            </View>
          </View>
          {isAuto && (
            <View className="bg-success/20 px-1.5 py-0.5 rounded">
              <Text className="text-success text-[9px] font-bold">스마트 제안</Text>
            </View>
          )}
          {isMissing && (
            <View className="bg-warning-soft px-2 py-1 rounded">
              <Text className="text-white text-[10px] font-bold">예약 필요</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // 일반 이벤트 — 노드 스타일
  return (
    <View className="flex-row">
      <View className="items-center w-8 mr-3">
        <View className="w-8 h-8 rounded-full bg-card border border-gray-700 items-center justify-center">
          <Text className="text-sm">{EVENT_ICONS[event.type]}</Text>
        </View>
        {!isLast && <View className="w-0.5 flex-1 bg-gray-800 mt-1" />}
      </View>

      <TouchableOpacity
        onPress={isDerived || event.type === 'flight' ? onOpenCalc : onEdit}
        className="flex-1 mb-3 py-2"
      >
        <View className="flex-row items-center gap-1.5 mb-0.5">
          <Text className="text-gray-400 text-xs font-bold">{event.time}</Text>
          {isDerived && (
            <View className="bg-primary-dim/20 border border-primary-dim/30 px-1.5 py-0.5 rounded ml-1">
              <Text className="text-primary text-[9px] font-bold">💡 스마트 타임라인</Text>
            </View>
          )}
        </View>
        <Text className={`text-[15px] font-bold ${event.type === 'warning' ? 'text-warning-soft' : 'text-white'}`}>
          {event.title}
        </Text>
        {event.sub && (
          <Text className="text-gray-500 text-xs mt-0.5">{event.sub}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function MainTimelineScreen() {
  const { selectedDayIndex, setSelectedDay, selectedTimeline, currentTrip } = useTripStore();
  const openReverseCalcModal = useTripStore((state) => state.openReverseCalcModal);
  const trip = currentTrip();
  const timeline = selectedTimeline();
  const gapCount = trip?.timelines.flatMap((t) => t.gaps).length ?? 0;

  const [editingEvent, setEditingEvent] = useState<TripEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  if (!trip) return null;

  function openAdd() {
    setEditingEvent(null);
    setShowEventForm(true);
  }

  function openEdit(event: TripEvent) {
    setEditingEvent(event);
    setShowEventForm(true);
  }

  // 빈 일정
  if (trip.timelines.length === 0 || !timeline) {
    return (
      <View className="flex-1 bg-background px-6">
        <View className="pt-4 pb-3">
          <Text className="text-gray-500 text-xs">{trip.startDate} – {trip.endDate}</Text>
        </View>
        <View className="flex-1 items-center justify-center pb-20">
          <Text className="text-4xl mb-4">🗓</Text>
          <Text className="text-white text-base font-semibold mb-2">아직 일정이 없어요</Text>
          <Text className="text-gray-500 text-sm text-center mb-8">
            비행기, 숙소, 이동 수단 등{'\n'}첫 이벤트를 추가해 보세요.
          </Text>
          <TouchableOpacity
            onPress={openAdd}
            className="px-6 py-3 rounded-xl bg-accent items-center"
          >
            <Text className="text-white text-sm font-semibold">+ 첫 이벤트 추가</Text>
          </TouchableOpacity>
        </View>
        <EventFormModal
          visible={showEventForm}
          tripId={trip.id}
          dayIndex={0}
          event={null}
          onClose={() => setShowEventForm(false)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Map Placeholder */}
      <MapPlaceholder tripTitle={trip.title} />

      {/* Day selector pills */}
      <View className="bg-background border-b border-gray-800">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3" style={{ flexGrow: 0 }}>
          {trip.timelines.map((t, idx) => {
            const isActive = idx === selectedDayIndex;
            return (
              <TouchableOpacity
                key={t.day}
                onPress={() => setSelectedDay(idx)}
                className={`mr-2 px-4 py-2 rounded-full ${
                  isActive ? 'bg-white' : 'bg-card border border-gray-800'
                }`}
              >
                <Text className={`text-[13px] font-medium ${
                  isActive ? 'text-gray-900 font-bold' : 'text-gray-400'
                }`}>
                  Day {t.day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Timeline events */}
      <ScrollView className="flex-1 px-4 pt-4">
        {timeline.events.map((event, idx) => (
          <EventItem
            key={event.id}
            event={event}
            isLast={idx === timeline.events.length - 1}
            onEdit={() => openEdit(event)}
            onOpenCalc={openReverseCalcModal}
          />
        ))}

        {/* Gap warnings */}
        {timeline.gaps.map((gap) => (
          <View key={gap.id} className="mb-3 p-3 rounded-lg border border-warning-soft/40 bg-orange-950/20">
            <Text className="text-warning-soft text-xs font-medium">💡 이동 수단이 필요해요</Text>
            <Text className="text-gray-400 text-xs mt-1">{gap.message}</Text>
          </View>
        ))}

        {/* + 이벤트 추가 버튼 */}
        <TouchableOpacity
          onPress={openAdd}
          className="mb-4 py-4 rounded-2xl border border-gray-800 bg-card items-center"
        >
          <Text className="text-accent text-sm font-bold">+ 장소 및 일정 추가</Text>
        </TouchableOpacity>

        <View className="h-8" />
      </ScrollView>

      <EventFormModal
        visible={showEventForm}
        tripId={trip.id}
        dayIndex={selectedDayIndex}
        event={editingEvent}
        onClose={() => setShowEventForm(false)}
      />
    </View>
  );
}
