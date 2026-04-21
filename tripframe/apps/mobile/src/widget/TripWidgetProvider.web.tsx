import React from 'react';
import type { WidgetData } from './widgetBridge';

// 웹에서는 Android 위젯이 동작하지 않으므로 no-op 컴포넌트
export function TripWidgetProvider(_props: { data?: WidgetData | null }) {
  return <></>;
}
