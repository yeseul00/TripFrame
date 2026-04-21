import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widgetTaskHandler';

// Android 전용 위젯 핸들러 등록
export function registerWidget() {
  registerWidgetTaskHandler(widgetTaskHandler);
}
