import { InitializeOptions } from 'react-ga';

export const trackingId = import.meta.env.APP_GA_TRACKING_ID;
const isDev = import.meta.env.APP_ENVIRONMENT === 'development';

export const gaConfig: InitializeOptions = {
    debug: isDev,
    testMode: isDev,
    gaOptions: {
        userId: undefined,
    },
};
