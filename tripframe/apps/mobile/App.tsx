import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTripStore } from './src/store/useTripStore';
import { MainTimelineScreen } from './src/screens/MainTimelineScreen';
import { MoveCheckScreen } from './src/screens/MoveCheckScreen';
import { ReverseCalcDetailScreen } from './src/screens/ReverseCalcDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen, ONBOARDING_FLAG_KEY } from './src/screens/OnboardingScreen';
import { encryptedStorage, migrateFromAsyncStorage, migrateMasterKey } from './src/storage/encryptedStorage';
import { supabase } from './src/lib/supabase';
import { ensureUserProfile } from './src/lib/userProfile';
import { useRealtimeSync } from './src/hooks/useRealtimeSync';
import type { Session } from '@supabase/supabase-js';
import './global.css';

const TABS = ['일정', '이동 체크', '역산', '설정'] as const;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [keyMigrating, setKeyMigrating] = useState(true);
  const userId = session?.user.id ?? null;
  const syncStatus = useRealtimeSync(userId);
  const currentTab = useTripStore((state) => state.currentTab);
  const setCurrentTab = useTripStore((state) => state.setCurrentTab);
  const setSelectedDay = useTripStore((state) => state.setSelectedDay);
  const setOpenGapKey = useTripStore((state) => state.setOpenGapKey);
  const currentTripId = useTripStore((state) => state.currentTripId);
  const selectTrip = useTripStore((state) => state.selectTrip);
  const currentTrip = useTripStore((state) => state.currentTrip);

  useEffect(() => {
    // E2E 테스트 환경에서 온보딩 스킵 (?e2e=1 파라미터)
    const isE2E =
      typeof window !== 'undefined' &&
      window.location?.search?.includes('e2e=1');
    if (isE2E) {
      setOnboardingDone(true);
      return;
    }
    // SecureStore 마스터 키 마이그레이션 → 이후 데이터 마이그레이션 + 온보딩 플래그 확인
    migrateMasterKey()
      .catch(() => {
        // 마이그레이션 실패 시 kv-store 폴백으로 계속 진행
      })
      .finally(() => {
        setKeyMigrating(false);
        Promise.all([
          migrateFromAsyncStorage(),
          encryptedStorage.getItem(ONBOARDING_FLAG_KEY),
        ]).then(([, flag]) => {
          setOnboardingDone(flag === 'true');
        });
      });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        ensureUserProfile(newSession.user.id);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // 키 마이그레이션 중 — 로딩 인디케이터 표시 (TASK-094)
  if (keyMigrating) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="small" color="#A78BFA" />
      </View>
    );
  }

  // 플래그 로딩 중 — 빈 화면 (스플래시 대체)
  if (onboardingDone === null) {
    return <View className="flex-1 bg-background" />;
  }

  // 온보딩 미완료 — OnboardingScreen 표시
  if (!onboardingDone) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={() => setOnboardingDone(true)} />
      </>
    );
  }

  // 홈 화면: 여행이 선택되지 않은 경우
  if (!currentTripId) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar style="light" />
        <HomeScreen onSelectTrip={(id) => selectTrip(id)} />
      </View>
    );
  }

  /**
   * 딥링크 헬퍼 — 탭 전환 + 선택적 파라미터 전달
   * 사용 예: navigateTo('이동 체크', { gapKey: 'A-B-0' })
   */
  function navigateTo(tab: typeof TABS[number], params?: { gapKey?: string; dayIndex?: number }) {
    setCurrentTab(tab);
    if (params?.gapKey) {
      setOpenGapKey(params.gapKey);
    }
    if (params?.dayIndex !== undefined) {
      setSelectedDay(params.dayIndex);
    }
  }

  const renderScreen = () => {
    switch (currentTab) {
      case '일정': return <MainTimelineScreen />;
      case '이동 체크': return <MoveCheckScreen />;
      case '역산': return <ReverseCalcDetailScreen />;
      case '설정': return <SettingsScreen syncStatus={syncStatus} />;
      default: return <MainTimelineScreen />;
    }
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      {/* Shared Top Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-3 border-b border-gray-800">
        <TouchableOpacity
          onPress={() => selectTrip(null)}
          className="px-3 py-1 rounded-full bg-card border border-gray-700 min-w-[60px]"
        >
          <Text className="text-muted text-xs text-center">← 홈</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white text-sm font-semibold">{currentTrip()?.title ?? ''}</Text>
          <Text className="text-muted text-xs">{currentTab}</Text>
        </View>
        <View className="min-w-[60px]" />
      </View>

      {/* Active Screen */}
      <View className="flex-1">
        {renderScreen()}
      </View>

      {/* Custom Bottom Tab Bar */}
      <View className="flex-row bg-card/80 border-t border-gray-800 pb-8 pt-4 px-4 justify-around items-center">
        {TABS.map((tab) => {
          const isActive = currentTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setCurrentTab(tab)}
              className="items-center"
            >
              <Text className={`text-[12px] ${isActive ? 'text-primary font-bold' : 'text-muted'}`}>
                {tab}
              </Text>
              {isActive && <View className="w-1 h-1 rounded-full bg-primary mt-1" />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
