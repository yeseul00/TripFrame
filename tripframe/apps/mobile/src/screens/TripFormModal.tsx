import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useTripStore } from '../store/useTripStore';
import type { Trip } from '@tripframe/core';

interface TripFormModalProps {
  visible: boolean;
  trip: Trip | null; // null = 신규 생성, Trip = 수정 모드
  onClose: () => void;
}

function generateId(): string {
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildEmptyTrip(): Trip {
  return {
    id: generateId(),
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    timelines: [],
  };
}

interface FormState {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

export function TripFormModal({ visible, trip, onClose }: TripFormModalProps) {
  const addTrip = useTripStore((state) => state.addTrip);
  const updateTrip = useTripStore((state) => state.updateTrip);
  const deleteTrip = useTripStore((state) => state.deleteTrip);

  const isEditMode = trip !== null;

  const [form, setForm] = useState<FormState>({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
  });
  const [titleError, setTitleError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm({
        title: trip?.title ?? '',
        destination: trip?.destination ?? '',
        startDate: trip?.startDate ?? '',
        endDate: trip?.endDate ?? '',
      });
      setTitleError('');
      setDeleteConfirm(false);
    }
  }, [visible, trip]);

  function handleSave() {
    if (!form.title.trim()) {
      setTitleError('여행명을 입력해 주세요.');
      return;
    }

    if (isEditMode && trip) {
      updateTrip(trip.id, {
        title: form.title.trim(),
        destination: form.destination.trim() || undefined,
        startDate: form.startDate.trim(),
        endDate: form.endDate.trim(),
      });
    } else {
      addTrip({
        ...buildEmptyTrip(),
        title: form.title.trim(),
        destination: form.destination.trim() || undefined,
        startDate: form.startDate.trim(),
        endDate: form.endDate.trim(),
      });
    }

    onClose();
  }

  function handleConfirmDelete() {
    if (!trip) return;
    deleteTrip(trip.id);
    onClose();
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
            {isEditMode ? '여행 수정' : '새 여행'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-primary text-base font-semibold">저장</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 pt-6">
          {/* 여행명 */}
          <View className="mb-5">
            <Text className="text-muted text-xs mb-1.5">
              여행명 <Text className="text-danger">*</Text>
            </Text>
            <TextInput
              value={form.title}
              onChangeText={(v) => {
                setForm((f) => ({ ...f, title: v }));
                if (v.trim()) setTitleError('');
              }}
              placeholder="예: 후쿠오카 · 유후인"
              placeholderTextColor="#6B7280"
              className="bg-card border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
            />
            {!!titleError && (
              <Text className="text-danger text-xs mt-1">{titleError}</Text>
            )}
          </View>

          {/* 목적지 */}
          <View className="mb-5">
            <Text className="text-muted text-xs mb-1.5">목적지</Text>
            <TextInput
              value={form.destination}
              onChangeText={(v) => setForm((f) => ({ ...f, destination: v }))}
              placeholder="예: 일본 후쿠오카"
              placeholderTextColor="#6B7280"
              className="bg-card border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
            />
          </View>

          {/* 출발일 */}
          <View className="mb-5">
            <Text className="text-muted text-xs mb-1.5">출발일</Text>
            <TextInput
              value={form.startDate}
              onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
              placeholder="예: 2026.06.18"
              placeholderTextColor="#6B7280"
              className="bg-card border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
            />
          </View>

          {/* 귀국일 */}
          <View className="mb-5">
            <Text className="text-muted text-xs mb-1.5">귀국일</Text>
            <TextInput
              value={form.endDate}
              onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))}
              placeholder="예: 2026.06.20"
              placeholderTextColor="#6B7280"
              className="bg-card border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
            />
          </View>

          {/* 삭제 버튼 (수정 모드만) */}
          {isEditMode && !deleteConfirm && (
            <TouchableOpacity
              onPress={() => setDeleteConfirm(true)}
              className="mt-4 mb-8 p-4 rounded-xl border border-danger/40 bg-red-950/20 items-center"
            >
              <Text className="text-danger text-sm font-medium">이 여행 삭제</Text>
            </TouchableOpacity>
          )}

          {/* 삭제 확인 UI */}
          {isEditMode && deleteConfirm && (
            <View className="mt-4 mb-8 p-4 rounded-xl border border-danger/60 bg-red-950/30">
              <Text className="text-white text-sm text-center mb-3">
                정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setDeleteConfirm(false)}
                  className="flex-1 p-3 rounded-xl border border-gray-600 items-center"
                >
                  <Text className="text-muted text-sm">취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmDelete}
                  className="flex-1 p-3 rounded-xl bg-red-700 items-center"
                >
                  <Text className="text-white text-sm font-semibold">삭제 확인</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View className="h-8" />
        </ScrollView>
      </View>
    </Modal>
  );
}
