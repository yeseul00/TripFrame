import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTripStore } from '../store/useTripStore';
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

function EventItem({ event, isLast }: { event: TripEvent; isLast: boolean }) {
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
      <View className={`flex-1 mb-3 p-3 rounded-lg ${isDanger ? 'border border-danger bg-red-950/30' : 'bg-card'}`}>
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
        </View>
      </View>
    </View>
  );
}

export function MainTimelineScreen() {
  const { trip, selectedDayIndex, setSelectedDay, selectedTimeline } = useTripStore();
  const timeline = selectedTimeline();
  const gapCount = trip.timelines.flatMap((t) => t.gaps).length;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-12 pb-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-xl font-bold">{trip.title}</Text>
            <Text className="text-gray-500 text-xs mt-0.5">
              {trip.startDate} – {trip.endDate}
            </Text>
          </View>
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
          />
        ))}

        {/* Gap warnings */}
        {timeline.gaps.map((gap) => (
          <View key={gap.id} className="mb-3 p-3 rounded-lg border border-danger/60 bg-red-950/20">
            <Text className="text-danger text-xs font-medium">⚠ 이동 수단 누락</Text>
            <Text className="text-gray-400 text-xs mt-1">{gap.message}</Text>
          </View>
        ))}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
