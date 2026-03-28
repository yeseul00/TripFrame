import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTripStore } from './src/store/useTripStore';
import { MainTimelineScreen } from './src/screens/MainTimelineScreen';
import { GapAnalysisScreen } from './src/screens/GapAnalysisScreen';
import { ReverseCalcDetailScreen } from './src/screens/ReverseCalcDetailScreen';
import { SuggestionScreen } from './src/screens/SuggestionScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { supabase } from './src/lib/supabase';
import { ensureUserProfile } from './src/lib/userProfile';
import { useRealtimeSync } from './src/hooks/useRealtimeSync';
import type { Session } from '@supabase/supabase-js';
import './global.css';

const TABS = ['일정', '공백감지', '제안카드', '역산', '설정'] as const;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const userId = session?.user.id ?? null;
  useRealtimeSync(userId);
  const currentTab = useTripStore((state) => state.currentTab);
  const setCurrentTab = useTripStore((state) => state.setCurrentTab);
  const currentTripId = useTripStore((state) => state.currentTripId);
  const selectTrip = useTripStore((state) => state.selectTrip);
  const currentTrip = useTripStore((state) => state.currentTrip);

  useEffect(() => {
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

  // 홈 화면: 여행이 선택되지 않은 경우
  if (!currentTripId) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar style="light" />
        <HomeScreen onSelectTrip={(id) => selectTrip(id)} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (currentTab) {
      case '일정': return <MainTimelineScreen />;
      case '공백감지': return <GapAnalysisScreen />;
      case '제안카드': return <SuggestionScreen />;
      case '역산': return <ReverseCalcDetailScreen />;
      case '설정': return <SettingsScreen />;
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
