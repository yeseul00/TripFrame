import { registerRootComponent } from 'expo'
import App from './App'
import { registerWidget } from './src/widget/registerWidget'

registerRootComponent(App)
// Metro가 웹 빌드 시 registerWidget.web.ts(no-op)를 선택하므로
// react-native-android-widget이 웹 번들에서 완전히 제거됨
registerWidget()
