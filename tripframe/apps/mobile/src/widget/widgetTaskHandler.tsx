import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { readWidgetData } from './widgetBridge';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, renderWidget } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      let data = null;
      try {
        data = await readWidgetData();
      } catch {
        // AsyncStorage 실패 시 null data로 폴백
      }
      const { TripWidgetProvider } = await import('./TripWidgetProvider');
      // light/dark 모두 명시: dark만 넘기지 않으면 다크모드 기기에서 투명하게 보임
      renderWidget({
        light: <TripWidgetProvider data={data} />,
        dark: <TripWidgetProvider data={data} />,
      });
      break;
    }
    case 'WIDGET_DELETED':
      break;
    default:
      break;
  }
}
