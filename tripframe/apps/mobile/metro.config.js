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

module.exports = withNativeWind(config, { input: './global.css' });
