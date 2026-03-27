import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTripStore } from './src/store/useTripStore';
import { MainTimelineScreen } from './src/screens/MainTimelineScreen';
import { GapAnalysisScreen } from './src/screens/GapAnalysisScreen';
import { ReverseCalcDetailScreen } from './src/screens/ReverseCalcDetailScreen';
import './global.css';

const TABS = ['일정', '공백감지', '제안카드', '역산'] as const;
type TabName = (typeof TABS)[number];

export default function App() {
  const currentTab = useTripStore((state) => state.currentTab);
  const setCurrentTab = useTripStore((state) => state.setCurrentTab);

  const renderScreen = () => {
    switch (currentTab) {
      case '일정': return <MainTimelineScreen />;
      case '공백감지': return <GapAnalysisScreen />;
      case '역산': return <ReverseCalcDetailScreen />;
      default: return <MainTimelineScreen />;
    }
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      
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
