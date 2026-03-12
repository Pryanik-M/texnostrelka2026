import path from 'path';
import * as dotenv from 'dotenv';

const app = require('./app.json');

export default () => {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

  const base = app.expo ?? {};
  const baseExtra = base.extra ?? {};
  const easProjectId =
    (baseExtra.eas && (baseExtra.eas as { projectId?: string }).projectId) ||
    process.env.EAS_PROJECT_ID ||
    '7a13f90c-0fef-4422-89b6-552f9ba3fca9';
  const iosBase = base.ios ?? {};
  const iosBundleIdentifier =
    (iosBase as { bundleIdentifier?: string }).bundleIdentifier ||
    process.env.EXPO_IOS_BUNDLE_IDENTIFIER ||
    'com.anonymous.subscriptionmonitor';

  return {
    ...base,
    ios: {
      ...iosBase,
      bundleIdentifier: iosBundleIdentifier,
      infoPlist: {
        ...(iosBase as { infoPlist?: Record<string, unknown> }).infoPlist,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    extra: {
      ...baseExtra,
      eas: { projectId: easProjectId },
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
      EXPO_PUBLIC_API_BASE_URL_IP: process.env.EXPO_PUBLIC_API_BASE_URL_IP,
      EXPO_PUBLIC_API_BASE_URL_LOCAL: process.env.EXPO_PUBLIC_API_BASE_URL_LOCAL,
      EXPO_PUBLIC_API_BASE_URL_TUNNEL: process.env.EXPO_PUBLIC_API_BASE_URL_TUNNEL,
    },
  };
};
