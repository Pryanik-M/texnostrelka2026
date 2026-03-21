const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@react-native-async-storage/async-storage': path.resolve(
    __dirname,
    'node_modules/@react-native-async-storage/async-storage'
  ),
};

module.exports = config;
