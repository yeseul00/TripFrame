import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTripStore, setStoreUserId } from './src/store/useTripStore';
import type { TabName } from './src/store/useTripStore';
import { MainTimelineScreen } from './src/screens/MainTimelineScreen';
import { MoveCheckScreen } from './src/screens/MoveCheckScreen';
import { ReverseCalcDetailScreen } from './src/screens/ReverseCalcDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen, ONBOARDING_FLAG_KEY } from './src/screens/OnboardingScreen';
import { encryptedStorage, migrateFromAsyncStorage, migrateMasterKey } from './src/storage/encryptedStorage';
import { supabase } from './src/lib/supabase';
import { ensureUserProfile } from './src/lib/userProfile';
import { fetchRemoteTrips } from './src/lib/supabaseSync';
import { dbRowToTrip, mergeTripsOnLogin } from './src/lib/tripMapper';
import { useRealtimeSync } from './src/hooks/useRealtimeSync';
import { syncWidgetData, buildWidgetData } from './src/widget/widgetBridge';
import { TripWidgetProvider } from './src/widget/TripWidgetProvider';
import type { Session } from '@supabase/supabase-js';
import './global.css';

const TABS: { key: TabName; label: string; icon: string }[] = [
  { key: '홈', label: '홈', icon: '🏠' },
  { key: '일정', label: '일정', icon: '🗺️' },
  { key: '스마트 체크', label: '스마트 체크', icon: '💡' },
  { key: '마이', label: '마이', icon: '👤' },
];

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
  const trips = useTripStore((state) => state.trips);
  const showReverseCalcModal = useTripStore((state) => state.showReverseCalcModal);
  const closeReverseCalcModal = useTripStore((state) => state.closeReverseCalcModal);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // E2E 테스트 환경에서 온보딩 스킵 (?e2e=1 파라미터)
    const isE2E =
      typeof window !== 'undefined' &&
      window.location?.search?.includes('e2e=1');
    if (isE2E) {
      setKeyMigrating(false);
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

    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const uid = newSession?.user.id ?? null;

      // syncEngine에 userId 주입 (로그아웃 시 null)
      setStoreUserId(uid);

      if (uid) {
        ensureUserProfile(uid);

        // 로그인 직후 원격 Trip 불러와 로컬과 병합 (remote 우선, local-only 보존)
        fetchRemoteTrips(uid).then((rows) => {
          if (rows.length === 0) return;
          const remoteTrips = rows.map(dbRowToTrip);
          const localTrips = useTripStore.getState().trips;
          const merged = mergeTripsOnLogin(localTrips, remoteTrips);
          useTripStore.getState().setTrips(merged);
        });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // trips 변경 시 위젯 데이터 동기화 (Android only)
  useEffect(() => {
    // 첫 렌더(초기화 전)는 건너뜀 — trips가 아직 rehydrate 중일 수 있음
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (Platform.OS !== 'android') return;

    const data = buildWidgetData(trips);
    syncWidgetData(trips)
      .then(() =>
        import('react-native-android-widget').then(({ requestWidgetUpdate }) =>
          requestWidgetUpdate({
            widgetName: 'TripWidget',
            renderWidget: () => ({
              light: <TripWidgetProvider data={data} />,
              dark: <TripWidgetProvider data={data} />,
            }),
            widgetNotFound: () => {},
          })
        )
      )
      .catch(() => {});
  }, [trips]);

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

  /**
   * 딥링크 헬퍼 — 탭 전환 + 선택적 파라미터 전달
   * 사용 예: navigateTo('스마트 체크', { gapKey: 'A-B-0' })
   */
  function navigateTo(tab: TabName, params?: { gapKey?: string; dayIndex?: number }) {
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
      case '홈':
        return <HomeScreen onSelectTrip={(id) => selectTrip(id)} />;
      case '일정':
        return currentTripId
          ? <MainTimelineScreen />
          : <NoTripPlaceholder onGoHome={() => setCurrentTab('홈')} />;
      case '스마트 체크':
        return currentTripId
          ? <MoveCheckScreen />
          : <NoTripPlaceholder onGoHome={() => setCurrentTab('홈')} />;
      case '마이':
        return <SettingsScreen syncStatus={syncStatus} />;
      default:
        return <HomeScreen onSelectTrip={(id) => selectTrip(id)} />;
    }
  };

  const showHeader = currentTab !== '홈' && currentTripId;

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      {/* Shared Top Header — trip 선택 시에만 표시 */}
      {showHeader && (
        <View className="flex-row items-center justify-between px-4 pt-12 pb-3 border-b border-gray-800">
          <TouchableOpacity
            onPress={() => { selectTrip(null); setCurrentTab('홈'); }}
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
      )}

      {/* Active Screen */}
      <View className="flex-1">
        {renderScreen()}
      </View>

      {/* Custom Bottom Tab Bar — 4탭 (아이콘 + 라벨) */}
      <View className="flex-row bg-card border-t border-gray-800 pb-8 pt-3 px-4 justify-around items-center">
        {TABS.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setCurrentTab(tab.key)}
              className="items-center px-2"
            >
              <Text className={`text-[20px] ${isActive ? '' : 'opacity-50'}`}>
                {tab.icon}
              </Text>
              <Text className={`text-[10px] mt-1 ${isActive ? 'text-accent font-bold' : 'text-muted'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 스마트 타임라인 (역산) 모달 */}
      <Modal
        visible={showReverseCalcModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeReverseCalcModal}
      >
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 pt-14 pb-3 border-b border-gray-800">
            <Text className="text-white text-lg font-bold">스마트 타임라인</Text>
            <TouchableOpacity onPress={closeReverseCalcModal}>
              <Text className="text-muted text-sm">닫기</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1">
            <ReverseCalcDetailScreen />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/** 여행이 선택되지 않았을 때 표시되는 플레이스홀더 */
function NoTripPlaceholder({ onGoHome }: { onGoHome: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-muted text-3xl mb-3">🗺️</Text>
      <Text className="text-white text-base font-semibold mb-2">여행을 선택해 주세요</Text>
      <Text className="text-muted text-sm text-center mb-6">홈 탭에서 여행을 선택하면 일정과 스마트 체크를 확인할 수 있어요.</Text>
      <TouchableOpacity onPress={onGoHome} className="bg-accent px-6 py-3 rounded-xl">
        <Text className="text-white font-bold text-sm">홈으로 이동</Text>
      </TouchableOpacity>
    </View>
  );
}
