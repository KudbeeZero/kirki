/**
 * Babel config for the Expo app. `babel-preset-expo` handles JSX, TypeScript,
 * and React Native transforms.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
