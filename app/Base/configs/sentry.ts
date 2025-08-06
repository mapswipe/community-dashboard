import { useEffect } from 'react';
import {
    createRoutesFromChildren,
    matchRoutes,
    useLocation,
    useNavigationType,
} from 'react-router';
import {
    BrowserOptions,
    reactRouterV7BrowserTracingIntegration,
} from '@sentry/react';

// import { Integrations } from '@sentry/tracing';

const appName = import.meta.env.MY_APP_ID;

const sentryDsn = import.meta.env.APP_SENTRY_DSN;

const tracesSampleRateFromEnv = Number(import.meta.env.APP_SENTRY_DSN);
const tracesSampleRate = Number.isNaN(tracesSampleRateFromEnv) ? 0.2 : tracesSampleRateFromEnv;

const env = import.meta.env.APP_ENVIRONMENT;

const sentryConfig: BrowserOptions | undefined = sentryDsn ? {
    dsn: sentryDsn,
    release: appName,
    environment: env,
    tracesSampleRate,
    normalizeDepth: 5,
    integrations: [
        reactRouterV7BrowserTracingIntegration({
            useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes,
        }),
    ],
} : undefined;

export default sentryConfig;
