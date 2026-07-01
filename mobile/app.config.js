const appConfig = require('./app.json');

// The Mapbox DOWNLOAD token (sk.*) must be set as an EAS secret:
//   eas secret:create --name RNMAPBOX_DOWNLOAD_TOKEN --value "sk.eyJ1IjoiZ..."
// It is injected at build time by EAS and should NEVER be committed.
//
// The public ACCESS token (pk.*) is set via EXPO_PUBLIC_MAPBOX_TOKEN in eas.json env.

const downloadToken = process.env.RNMAPBOX_DOWNLOAD_TOKEN || 'RNMAPBOX_DOWNLOAD_TOKEN_PLACEHOLDER';

module.exports = {
  ...appConfig.expo,
  plugins: appConfig.expo.plugins.map((plugin) => {
    // Replace the @rnmapbox/maps plugin entry to inject the download token from env
    if (Array.isArray(plugin) && plugin[0] === '@rnmapbox/maps') {
      return [
        '@rnmapbox/maps',
        { RNMapboxMapsDownloadToken: downloadToken },
      ];
    }
    return plugin;
  }),
};
