import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useTripStore } from '../store/useTripStore';
import type { TripEvent, EventType } from '@tripframe/core';

interface EventFormModalProps {
  visible: boolean;
  tripId: string;
  dayIndex: number;
  event: TripEvent | null; // null = 신규 추가, TripEvent = 수정 모드
  onClose: () => void;
}

const EVENT_TYPE_OPTIONS: { value: EventType; label: string; icon: string }[] = [
  { value: 'flight', label: '항공편', icon: '✈' },
  { value: 'hotel', label: '숙소', icon: '🏨' },
  { value: 'transport', label: '교통', icon: '🚌' },
  { value: 'activity', label: '관광/식사', icon: '📍' },
  { value: 'home', label: '집 출발', icon: '🏠' },
  { value: 'prep', label: '준비', icon: '📦' },
];

function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

interface FormState {
  title: string;
  time: string;
  location: string;
  sub: string;
  type: EventType;
}

export function EventFormModal({
  visible,
  tripId,
  dayIndex,
  event,
  onClose,
}: EventFormModalProps) {
  const addEvent = useTripStore((state) => state.addEvent);
  const updateEvent = useTripStore((state) => state.updateEvent);
  const deleteEvent = useTripStore((state) => state.deleteEvent);

  const isEditMode = event !== null;

  const [form, setForm] = useState<FormState>({
    title: '',
    time: '',
    location: '',
    sub: '',
    type: 'activity',
  });

  useEffect(() => {
    if (visible) {
      setForm({
        title: event?.title ?? '',
        time: event?.time ?? '',
        location: event?.location ?? '',
        sub: event?.sub ?? '',
        type: event?.type ?? 'activity',
      });
    }
  }, [visible, event]);

  function handleSave() {
    if (!form.title.trim()) {
      Alert.alert('입력 오류', '이벤트명을 입력해 주세요.');
      return;
    }
    if (!form.time.trim()) {
      Alert.alert('입력 오류', '시간을 입력해 주세요. (예: 14:30)');
      return;
    }

    const updates: Partial<TripEvent> = {
      title: form.title.trim(),
      time: form.time.trim(),
      type: form.type,
      status: 'ok',
      location: form.location.trim() || undefined,
      sub: form.sub.trim() || undefined,
    };

    if (isEditMode && event) {
      updateEvent(tripId, dayIndex, event.id, updates);
    } else {
      addEvent(tripId, dayIndex, {
        id: generateEventId(),
        isDerived: false,
        ...updates,
        title: updates.title ?? '',
        time: updates.time ?? '',
        type: updates.type ?? 'activity',
        status: 'ok',
      });
    }

    onClose();
  }

  function handleDelete() {
    if (!event) return;
    Alert.alert(
      '이벤트 삭제',
      `"${event.title}"을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteEvent(tripId, dayIndex, event.id);
            onClose();
          },
        },
      ]
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* 헤더 */}
        <View className="flex-row justify-between items-center px-4 pt-6 pb-4 border-b border-gray-800">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-muted text-base">취소</Text>
          </TouchableOpacity>
          <Text className="text-white text-base font-semibold">
            {isEditMode ? '이벤트 수정' : '이벤트 추가'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-primary text-base font-semibold">저장</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 pt-6">
          {/* 이벤트 유형 */}
          <View className="mb-5">
            <Text className="text-muted text-xs mb-2">이벤트 유형</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {EVENT_TYPE_OPTIONS.map((opt) => {
                  const isSelected = form.type === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setForm((f) => ({ ...f, type: opt.value }))}
                      className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                        isSelected
                          ? 'bg-primary/20 border-primary'
                          : 'bg-card border-gray-700'
                      }`}
                    >
                      <Text className="text-base">{opt.icon}</Text>
                      <Text
                        className={`text-xs font-medium ${
                          isSelected ? 'text-primary' : 'text-muted'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* 이벤트명 */}
          <View className="mb-5">
            <Text className="text-muted text-xs mb-1.5">
              이벤트명 <Text className="text-danger">*</Text>
            </Text>
            <TextInput
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              placeholder="예: 후쿠오카행 비행기"
              placeholderTextColor="#6B7280"
              className="bg-card border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
            />
          </View>

          {/* 시간 */}
          <View className="mb-5">
            <Text className="text-muted text-xs mb-1.5">
              시간 <Text className="text-danger">*</Text>
            </Text>
            <TextInput
              value={form.time}
              onChangeText={(v) => setForm((f) => ({ ...f, time: v }))}
              placeholder="예: 14:30"
              placeholderTextColor="#6B7280"
              className="bg-card border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
            />
          </View>

          {/* 장소 */}
          <View className="mb-5">
            <Text className="text-muted text-xs mb-1.5">장소</Text>
            <TextInput
              value={form.location}
              onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
              placeholder="예: 하카타역"
              placeholderTextColor="#6B7280"
              className="bg-card border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
            />
          </View>

          {/* 부제목 */}
          <View className="mb-5">
            <Text className="text-muted text-xs mb-1.5">부제목 (선택)</Text>
            <TextInput
              value={form.sub}
              onChangeText={(v) => setForm((f) => ({ ...f, sub: v }))}
              placeholder="예: OZ132 / 미야코 호텔"
              placeholderTextColor="#6B7280"
              className="bg-card border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
            />
          </View>

          {/* 삭제 버튼 (수정 모드만) */}
          {isEditMode && (
            <TouchableOpacity
              onPress={handleDelete}
              className="mt-2 mb-8 p-4 rounded-xl border border-danger/40 bg-red-950/20 items-center"
            >
              <Text className="text-danger text-sm font-medium">이 이벤트 삭제</Text>
            </TouchableOpacity>
          )}

          <View className="h-8" />
        </ScrollView>
      </View>
    </Modal>
  );
}
