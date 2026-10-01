const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const protocolDir = path.resolve(__dirname, '../../packages/protocol');

const config = {
  watchFolders: [protocolDir],
  resolver: {
    extraNodeModules: {'@spotter/protocol': protocolDir},
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
