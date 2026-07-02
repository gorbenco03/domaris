const appConfig = require('./app.json');

// The Mapbox DOWNLOAD token (sk.* cu scope Downloads:Read) descarcă SDK-ul nativ la build.
//   - build EAS: setat ca EAS secret  ->  eas env:create --name RNMAPBOX_DOWNLOAD_TOKEN --value "sk...."
//   - build local: setat în mobile/.env.local (RNMAPBOX_DOWNLOAD_TOKEN sau RNMAPBOX_MAPS_DOWNLOAD_TOKEN)
// NU se commit-uiește niciodată.
//
// The public ACCESS token (pk.*) is set via EXPO_PUBLIC_MAPBOX_TOKEN in eas.json env.

const downloadToken =
  process.env.RNMAPBOX_DOWNLOAD_TOKEN ||
  process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN ||
  'RNMAPBOX_DOWNLOAD_TOKEN_PLACEHOLDER';

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
