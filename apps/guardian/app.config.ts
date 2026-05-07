import type { ExpoConfig } from 'expo/config';

const appJson = require('./app.json');

export default (): ExpoConfig => {
  const baseConfig = appJson.expo as ExpoConfig;
  const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? '';

  return {
    ...baseConfig,
    android: {
      ...baseConfig.android,
      config: {
        ...(baseConfig.android?.config ?? {}),
        googleMaps: {
          apiKey: mapsApiKey,
        },
      },
    },
    ios: {
      ...baseConfig.ios,
      config: {
        ...(baseConfig.ios?.config ?? {}),
        googleMapsApiKey: mapsApiKey,
      },
    },
  };
};
