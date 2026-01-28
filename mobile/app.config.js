const appConfig = require('./app.json');

module.exports = {
  ...appConfig.expo,
  plugins: [
    ...appConfig.expo.plugins,
    '@rnmapbox/maps', // Token-ul este citit direct din RNMAPBOX_MAPS_DOWNLOAD_TOKEN env var
  ],
};
