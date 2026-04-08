// React 19 Compiler가 이 컴포넌트를 변환하면 라이브러리의 직접 함수 호출 방식이 깨짐
"use no memo";
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './widgetBridge';

interface Props {
  data?: WidgetData | null;
}

function formatDDay(dDay: number): string {
  if (dDay === 0) return 'D-DAY';
  if (dDay > 0) return `D-${dDay}`;
  return `D+${Math.abs(dDay)}`;
}

export function TripWidgetProvider({ data }: Props) {
  const hasTrip = data?.hasTrip ?? false;
  const dDayText = hasTrip ? formatDDay(data!.dDay) : 'D-?';
  const titleText = hasTrip ? data!.tripTitle : '여행을 추가하세요';

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
        text={dDayText}
        style={{
          fontSize: 32,
          color: '#A78BFA',
          fontWeight: 'bold',
        }}
      />
      <TextWidget
        text={titleText}
        style={{
          fontSize: 14,
          color: '#FFFFFF',
        }}
      />
      {hasTrip && (
        <TextWidget
          text={`출발 ${data!.departureDate}`}
          style={{
            fontSize: 11,
            color: '#9CA3AF',
          }}
        />
      )}
    </FlexWidget>
  );
}
