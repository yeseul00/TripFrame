/**
 * IcalExportModal — iCal 내보내기 + Google Calendar 안내 (TASK-097)
 *
 * expo-sharing + expo-file-system으로 .ics 파일 생성 후 공유 시트 오픈.
 * 웹 환경에서는 Blob 다운로드로 대체.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, ActivityIndicator } from 'react-native';
import { generateIcal } from '@tripframe/core';
import { useGapStore } from '../store/useGapStore';
import type { Trip } from '@tripframe/core';

interface IcalExportModalProps {
  trip: Trip;
  onClose: () => void;
}

async function exportIcalFile(trip: Trip, resolvedGapStatus: Record<string, { resolvedAt: string }>) {
  const content = generateIcal(trip, resolvedGapStatus);

  if (Platform.OS === 'web') {
    // 웹: Blob 다운로드
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.title}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // 네이티브: expo-file-system + expo-sharing
  const FileSystem = await import('expo-file-system');
  const Sharing = await import('expo-sharing');

  const fileName = `tripframe-${trip.id}.ics`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/calendar', UTI: 'public.calendar-event' });
  }
}

export function IcalExportModal({ trip, onClose }: IcalExportModalProps) {
  const [phase, setPhase] = useState<'ready' | 'exporting' | 'done' | 'error'>('ready');
  const resolvedGaps = useGapStore((state) => state.resolvedGaps);

  // gapId → resolvedAt 매핑 (generateIcal 인터페이스 맞춤)
  const tripResolvedGaps = resolvedGaps[trip.id] ?? {};
  const resolvedGapStatus: Record<string, { resolvedAt: string }> = {};
  for (const [gapKey, entry] of Object.entries(tripResolvedGaps)) {
    // gapKey를 각 gap.id에 매핑하는 최선 노력 (gap.id는 trip 내부에서 확인)
    for (const tl of trip.timelines) {
      for (const gap of tl.gaps) {
        if (gap.id === gapKey || gapKey.includes(gap.fromEventId)) {
          resolvedGapStatus[gap.id] = { resolvedAt: entry.resolvedAt };
        }
      }
    }
  }

  async function handleExport() {
    setPhase('exporting');
    try {
      await exportIcalFile(trip, resolvedGapStatus);
      setPhase('done');
    } catch {
      setPhase('error');
    }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-card rounded-t-2xl px-6 pt-6 pb-10">
          <Text className="text-white text-lg font-bold mb-2">일정 내보내기</Text>

          {phase === 'ready' && (
            <>
              <Text className="text-muted text-sm mb-6">
                여행 일정을 .ics 파일로 내보냅니다.{'\n'}
                Google Calendar, Apple Calendar 등에서 가져올 수 있습니다.
              </Text>
              <TouchableOpacity
                onPress={handleExport}
                className="py-3 rounded-xl bg-primary items-center mb-3"
              >
                <Text className="text-white font-semibold">파일 내보내기</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} className="py-3 items-center">
                <Text className="text-muted">취소</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'exporting' && (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#A78BFA" />
              <Text className="text-muted text-sm mt-4">파일 생성 중...</Text>
            </View>
          )}

          {phase === 'done' && (
            <>
              <Text className="text-white text-sm font-semibold mb-3">✓ 파일이 생성되었습니다</Text>
              <View className="bg-gray-900 rounded-xl p-4 mb-6">
                <Text className="text-white text-sm font-semibold mb-2">Google Calendar에 추가하는 방법</Text>
                <Text className="text-muted text-xs leading-5">
                  1. Google Calendar 앱 열기{'\n'}
                  2. 설정 {'>'} 일정 가져오기{'\n'}
                  3. 다운로드된 .ics 파일 선택{'\n'}
                  4. 가져올 캘린더 선택 후 확인
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="py-3 rounded-xl bg-gray-800 items-center"
              >
                <Text className="text-white font-semibold">닫기</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'error' && (
            <>
              <Text className="text-danger text-sm mb-4">내보내기에 실패했습니다.</Text>
              <TouchableOpacity
                onPress={() => setPhase('ready')}
                className="py-3 rounded-xl bg-gray-800 items-center mb-3"
              >
                <Text className="text-white">다시 시도</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} className="py-3 items-center">
                <Text className="text-muted">취소</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
