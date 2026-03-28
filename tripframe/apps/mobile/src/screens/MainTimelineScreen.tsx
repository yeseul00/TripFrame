import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
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

function EventItem({
  event,
  isLast,
  onEdit,
}: {
  event: TripEvent;
  isLast: boolean;
  onEdit: () => void;
}) {
  const isDanger = event.status === 'missing';
  const isDerived = event.isDerived;

  return (
    <View className="flex-row">
      {/* Timeline line */}
      <View className="items-center w-8 mr-3">
        <View className={`w-2 h-2 rounded-full mt-1 ${isDanger ? 'bg-danger' : 'bg-primary'}`} />
        {!isLast && <View className="w-0.5 flex-1 bg-gray-800 mt-1" />}
      </View>

      {/* Event card */}
      <TouchableOpacity
        onPress={onEdit}
        className={`flex-1 mb-3 p-3 rounded-lg ${isDanger ? 'border border-danger bg-red-950/30' : 'bg-card'}`}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-gray-400 text-xs mb-0.5">{event.time}</Text>
            <Text className={`text-sm font-medium ${isDanger ? 'text-danger' : 'text-white'}`}>
              {EVENT_ICONS[event.type]} {event.title}
            </Text>
            {event.sub && (
              <Text className="text-gray-500 text-xs mt-0.5">{event.sub}</Text>
            )}
          </View>
          <View className="flex-row gap-1 items-center">
            {isDerived && (
              <View className="bg-primary/20 px-2 py-0.5 rounded">
                <Text className="text-primary text-xs">역산</Text>
              </View>
            )}
            {isDanger && (
              <View className="bg-danger/20 px-2 py-0.5 rounded">
                <Text className="text-danger text-xs">미예약</Text>
              </View>
            )}
            <Text className="text-gray-600 text-xs ml-1">✎</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export function MainTimelineScreen() {
  const { selectedDayIndex, setSelectedDay, selectedTimeline, currentTrip } = useTripStore();
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

  // 빈 일정: 이벤트가 하나도 없는 새 여행
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
            className="px-6 py-3 rounded-xl bg-primary items-center"
          >
            <Text className="text-background text-sm font-semibold">+ 첫 이벤트 추가</Text>
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
      {/* Header (여행 기간 + 공백 배지) */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-500 text-xs">
            {trip.startDate} – {trip.endDate}
          </Text>
          {gapCount > 0 && (
            <View className="bg-danger/20 border border-danger/40 px-2 py-1 rounded-lg">
              <Text className="text-danger text-xs font-medium">공백 {gapCount}개</Text>
            </View>
          )}
        </View>
      </View>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4" style={{ flexGrow: 0 }}>
        {trip.timelines.map((t, idx) => {
          const isActive = idx === selectedDayIndex;
          const hasGap = t.gaps.length > 0;
          return (
            <TouchableOpacity
              key={t.day}
              onPress={() => setSelectedDay(idx)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                isActive ? 'bg-primary border-primary' : 'border-gray-700 bg-card'
              }`}
            >
              <Text className={`text-xs font-medium ${isActive ? 'text-background' : hasGap ? 'text-danger' : 'text-gray-400'}`}>
                Day {t.day} {hasGap ? '⚠' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Date label */}
      <View className="px-4 mb-3">
        <Text className="text-gray-500 text-xs">{timeline.date}</Text>
      </View>

      {/* Timeline events */}
      <ScrollView className="flex-1 px-4">
        {timeline.events.map((event, idx) => (
          <EventItem
            key={event.id}
            event={event}
            isLast={idx === timeline.events.length - 1}
            onEdit={() => openEdit(event)}
          />
        ))}

        {/* Gap warnings */}
        {timeline.gaps.map((gap) => (
          <View key={gap.id} className="mb-3 p-3 rounded-lg border border-danger/60 bg-red-950/20">
            <Text className="text-danger text-xs font-medium">⚠ 이동 수단 누락</Text>
            <Text className="text-gray-400 text-xs mt-1">{gap.message}</Text>
          </View>
        ))}

        {/* + 이벤트 추가 버튼 */}
        <TouchableOpacity
          onPress={openAdd}
          className="mb-4 p-3 rounded-lg border border-dashed border-gray-700 items-center"
        >
          <Text className="text-muted text-sm">+ 이벤트 추가</Text>
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
