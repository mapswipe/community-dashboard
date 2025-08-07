import { matchPath } from 'react-router-dom';
import {
    BrowserOptions,
    reactRouterV5Instrumentation,
} from '@sentry/react';
import { Integrations } from '@sentry/tracing';

import browserHistory from '#base/configs/history';
import routes from '#base/configs/routes';

const appName = import.meta.env.MY_APP_ID;

const sentryDsn = import.meta.env.APP_SENTRY_DSN;

const tracesSampleRateFromEnv = Number(import.meta.env.APP_SENTRY_DSN);
const tracesSampleRate = Number.isNaN(tracesSampleRateFromEnv) ? 0.2 : tracesSampleRateFromEnv;

const env = import.meta.env.APP_ENVIRONMENT;

const sentryConfig: BrowserOptions | undefined = sentryDsn ? {
    dsn: sentryDsn,
    release: appName,
    environment: env,
    // sendDefaultPii: true,
    tracesSampleRate,
    normalizeDepth: 5,
    integrations: [
        new Integrations.BrowserTracing({
            routingInstrumentation: reactRouterV5Instrumentation(
                browserHistory,
                Object.entries(routes),
                matchPath,
            ),
        }),
    ],
} : undefined;

export default sentryConfig;
