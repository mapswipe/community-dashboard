import { InitializeOptions } from 'react-ga';

const isDev = import.meta.env.APP_ENVIRONMENT === 'development';
export const trackingId = import.meta.env.APP_GA_TRACKING_ID;

export const gaConfig: InitializeOptions = {
    debug: isDev,
    testMode: isDev,
    gaOptions: {
        userId: undefined,
    },
};
