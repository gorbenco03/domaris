module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/app': './src/app',
            '@/features': './src/features',
            '@/shared': './src/shared',
            '@/core': './src/core',
            '@/config': './src/config',
            '@/assets': './src/assets',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
