const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

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
