import { InitializeOptions } from 'react-ga';

import { readRuntimeConfig } from '#base/configs/env';

export const trackingId = readRuntimeConfig(import.meta.env.APP_GA_TRACKING_ID);
const isDev = readRuntimeConfig(import.meta.env.APP_ENVIRONMENT) === 'DEV';

export const gaConfig: InitializeOptions = {
    debug: isDev,
    testMode: isDev,
    gaOptions: {
        userId: undefined,
    },
};
