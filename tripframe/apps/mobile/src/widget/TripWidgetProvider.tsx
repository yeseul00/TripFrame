// React 19 Compiler가 이 컴포넌트를 변환하면 라이브러리의 직접 함수 호출 방식이 깨짐
"use no memo";
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function TripWidgetProvider() {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F0F13',
      }}
    >
      <TextWidget
        text="TripFrame"
        style={{
          fontSize: 16,
          color: '#A78BFA',
          fontWeight: 'bold',
        }}
      />
      <TextWidget
        text="여행을 추가하세요"
        style={{
          fontSize: 12,
          color: '#9CA3AF',
        }}
      />
    </FlexWidget>
  );
}
