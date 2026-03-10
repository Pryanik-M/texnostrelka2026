import path from 'path';
import * as dotenv from 'dotenv';

const app = require('./app.json');

export default () => {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

  const base = app.expo ?? {};

  return {
    ...base,
    extra: {
      ...(base.extra ?? {}),
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
      EXPO_PUBLIC_API_BASE_URL_IP: process.env.EXPO_PUBLIC_API_BASE_URL_IP,
      EXPO_PUBLIC_API_BASE_URL_LOCAL: process.env.EXPO_PUBLIC_API_BASE_URL_LOCAL,
      EXPO_PUBLIC_API_BASE_URL_TUNNEL: process.env.EXPO_PUBLIC_API_BASE_URL_TUNNEL,
    },
  };
};
