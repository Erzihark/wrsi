module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin powers react-native-reanimated (used by the
    // drag-to-reorder ranking in "Mis universidades"). It MUST be listed last.
    // In Reanimated 4 the plugin moved here from 'react-native-reanimated/plugin'.
    plugins: ['react-native-worklets/plugin'],
  };
};
