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

import { readRuntimeConfig } from '#base/configs/env';

// import { Integrations } from '@sentry/tracing';

const appName = import.meta.env.APP_ID;

const sentryDsn = readRuntimeConfig(import.meta.env.APP_SENTRY_DSN);

// NOTE: A variable that is unset, empty or out of range means "not configured"
// and keeps the default, whereas an explicit '0' disables tracing. Beware that
// Number('') and Number(' ') are 0, not NaN
const rawTracesSampleRate = readRuntimeConfig(import.meta.env.APP_SENTRY_TRACES_SAMPLE_RATE);
const tracesSampleRateFromEnv = rawTracesSampleRate?.trim();
const parsedTracesSampleRate = tracesSampleRateFromEnv
    ? Number(tracesSampleRateFromEnv)
    : Number.NaN;
const tracesSampleRateValid = Number.isFinite(parsedTracesSampleRate)
    && parsedTracesSampleRate >= 0
    && parsedTracesSampleRate <= 1;
const tracesSampleRate = tracesSampleRateValid ? parsedTracesSampleRate : 0.2;

const env = readRuntimeConfig(import.meta.env.APP_ENVIRONMENT);

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
