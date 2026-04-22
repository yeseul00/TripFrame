const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 웹 플랫폼 추가 — .web.ts / .web.tsx 파일 해석을 위해 필요
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 웹 빌드 시 react-native-android-widget → no-op stub으로 교체
// (FlexWidget, registerWidgetTaskHandler 등이 웹 번들에 포함되지 않도록)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-android-widget') {
    return {
      filePath: path.resolve(__dirname, 'src/widget/android-widget-stub.js'),
      type: 'sourceFile',
    };
  }
  if (platform === 'web' && moduleName === '@sentry/react-native') {
    return {
      filePath: path.resolve(__dirname, 'src/lib/sentry-stub.ts'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
  '@tripframe/core': path.resolve(__dirname, '../../packages/core'),
};

config.watchFolders = [
  path.resolve(__dirname, '../../packages/core'),
];

// Zustand v5는 exports 조건 'import'를 통해 ESM 버전(.mjs)을 선택함.
// ESM 버전에는 import.meta.env 코드가 포함되어 Chromium classic script에서 SyntaxError 발생.
// 'react-native' 조건을 'import'보다 먼저 두어 CJS 버전(.js)을 선택하도록 강제.
config.resolver.unstable_conditionNames = [
  'browser',
  'require',
  'react-native',
  'default',
];


module.exports = withNativeWind(config, { input: './global.css' });
