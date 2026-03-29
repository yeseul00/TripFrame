import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { supabase } from '../lib/supabase';
import { updateUserProfile, ensureUserProfile } from '../lib/userProfile';
import type { UserProfile } from '../lib/userProfile';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useSettingsStore } from '../store/useSettingsStore';
import type { LuggageSize, TransportPreference, BufferLevel } from '../store/useSettingsStore';
import type { SyncStatus } from '../hooks/useRealtimeSync';

type OptionItem<T extends string> = { label: string; value: T; desc: string };

const LUGGAGE_OPTIONS: OptionItem<LuggageSize>[] = [
  { label: '기내용', value: 'carry-on', desc: '수하물 찾기 시간 없음' },
  { label: '위탁용', value: 'checked', desc: '수하물 수취 20~30분 추가' },
];

const TRANSPORT_OPTIONS: OptionItem<TransportPreference>[] = [
  { label: '대중교통', value: 'transit', desc: '지하철·버스 우선 추천' },
  { label: '택시', value: 'taxi', desc: '빠르고 편한 이동 우선' },
  { label: '무관', value: 'any', desc: '가장 빠른 옵션 추천' },
];

const BUFFER_OPTIONS: OptionItem<BufferLevel>[] = [
  { label: '빡빡하게', value: 'tight', desc: '최소 여유시간으로 계산' },
  { label: '기본', value: 'normal', desc: '기본 여유시간 (기본값)' },
  { label: '여유있게', value: 'relaxed', desc: '넉넉한 버퍼 포함' },
];

function OptionGroup<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: OptionItem<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="mb-6">
      <Text className="text-muted text-xs uppercase tracking-widest mb-3">{title}</Text>
      <View className="gap-2">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className={`flex-row items-center justify-between p-4 rounded-xl border ${
                isSelected ? 'border-primary bg-primary/10' : 'border-gray-800 bg-card'
              }`}
            >
              <View>
                <Text className={`font-medium ${isSelected ? 'text-primary' : 'text-white'}`}>
                  {opt.label}
                </Text>
                <Text className="text-muted text-xs mt-0.5">{opt.desc}</Text>
              </View>
              {isSelected && (
                <View className="w-2 h-2 rounded-full bg-primary" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface SettingsScreenProps {
  syncStatus?: SyncStatus;
}

export function SettingsScreen({ syncStatus = 'idle' }: SettingsScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { promptAsync, isReady } = useGoogleAuth();
  const { settings, updateSettings } = useSettingsStore();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      if (uid) {
        const p = await ensureUserProfile(uid);
        setProfile(p);
      }
    });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUserId(null);
    setProfile(null);
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-4 pb-10">

      {/* 계정 섹션 */}
      <View className="mb-8 p-4 rounded-xl bg-card border border-gray-800">
        {userId ? (
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-medium">
                {profile?.display_name ?? '로그인됨'}
              </Text>
              <Text className={`text-xs mt-0.5 ${syncStatus === 'offline' ? 'text-warning' : 'text-muted'}`}>
                {syncStatus === 'connected' ? '✓ 동기화 완료' : syncStatus === 'offline' ? '⚠ 오프라인 모드' : '클라우드 동기화 활성화됨'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} className="px-3 py-1.5 rounded-lg bg-gray-800">
              <Text className="text-muted text-sm">로그아웃</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-medium">오프라인 모드</Text>
              <Text className="text-muted text-xs mt-0.5">로그인하면 클라우드 동기화</Text>
            </View>
            {isReady ? (
              <TouchableOpacity
                onPress={() => promptAsync()}
                className="px-3 py-1.5 rounded-lg bg-primary"
              >
                <Text className="text-white text-sm font-medium">Google 로그인</Text>
              </TouchableOpacity>
            ) : (
              <ActivityIndicator color="#A78BFA" size="small" />
            )}
          </View>
        )}
      </View>

      {/* 선호도 설정 — useSettingsStore (offline-first, encryptedStorage) */}
      <OptionGroup
        title="짐 크기"
        options={LUGGAGE_OPTIONS}
        value={settings.luggageSize}
        onChange={(v) => updateSettings({ luggageSize: v })}
      />

      <OptionGroup
        title="교통 선호"
        options={TRANSPORT_OPTIONS}
        value={settings.transportPreference}
        onChange={(v) => updateSettings({ transportPreference: v })}
      />

      <OptionGroup
        title="여유도"
        options={BUFFER_OPTIONS}
        value={settings.bufferLevel}
        onChange={(v) => updateSettings({ bufferLevel: v })}
      />

      {/* 피드백 */}
      <FeedbackSection userId={userId} />
    </ScrollView>
  );
}

function FeedbackSection({ userId }: { userId: string | null }) {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    await supabase.from('feedback').insert([{
      user_id: userId ?? null,
      rating,
      comment: comment.trim() || null,
      app_version: '2.0.0',
    }] as never);
    setSubmitted(true);
  }

  function handleClose() {
    setVisible(false);
    setRating(0);
    setComment('');
    setSubmitted(false);
  }

  return (
    <>
      <View className="mt-6 pt-6 border-t border-gray-800">
        <TouchableOpacity
          onPress={() => setVisible(true)}
          className="flex-row items-center justify-center py-3 rounded-xl bg-card border border-gray-800"
        >
          <Text className="text-muted text-sm">피드백 보내기</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View className="flex-1 bg-black/70 items-center justify-center px-6">
          <View className="bg-card rounded-2xl p-6 w-full">
            {submitted ? (
              <View className="items-center py-4">
                <Text className="text-primary text-2xl mb-2">✓</Text>
                <Text className="text-white font-semibold">감사합니다!</Text>
                <Text className="text-muted text-xs mt-1 mb-4">피드백이 전달되었습니다</Text>
                <TouchableOpacity onPress={handleClose} className="px-6 py-2 rounded-lg bg-primary">
                  <Text className="text-white font-medium">닫기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text className="text-white font-bold text-base mb-4">앱 평가</Text>
                <View className="flex-row justify-center gap-3 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <Text className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-700'}`}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="한줄 코멘트 (선택)"
                  placeholderTextColor="#6b7280"
                  className="bg-gray-900 rounded-xl px-4 py-3 text-white text-sm mb-4"
                  maxLength={100}
                />
                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={handleClose} className="flex-1 py-3 rounded-xl bg-gray-800 items-center">
                    <Text className="text-muted text-sm">취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={rating === 0}
                    className={`flex-1 py-3 rounded-xl items-center ${rating > 0 ? 'bg-primary' : 'bg-gray-800'}`}
                  >
                    <Text className={`text-sm font-medium ${rating > 0 ? 'text-white' : 'text-muted'}`}>제출</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
