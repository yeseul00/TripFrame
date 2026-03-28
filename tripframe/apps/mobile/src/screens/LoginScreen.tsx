import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

export function LoginScreen() {
  const { promptAsync, isReady } = useGoogleAuth();

  return (
    <View className="flex-1 bg-background items-center justify-center px-8">
      <Text className="text-white text-3xl font-bold mb-2">TripFrame</Text>
      <Text className="text-muted text-sm mb-16">여행 공백을 찾아드립니다</Text>

      {isReady ? (
        <TouchableOpacity
          onPress={() => promptAsync()}
          className="w-full bg-white rounded-xl py-4 flex-row items-center justify-center gap-2"
        >
          <Text className="text-gray-800 font-semibold text-base">
            Google로 계속하기
          </Text>
        </TouchableOpacity>
      ) : (
        <ActivityIndicator color="#A78BFA" />
      )}

      <Text className="text-muted text-xs mt-8 text-center">
        로그인하면 여행 데이터가 클라우드에 동기화됩니다
      </Text>
    </View>
  );
}
