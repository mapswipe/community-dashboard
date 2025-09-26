import {
    defineConfig,
    overrideDefineForWebAppServe,
    Schema,
} from '@julr/vite-plugin-validate-env';

const webAppServeEnabled = process.env.WEB_APP_SERVE_ENABLED?.toLowerCase() === 'true';
if (webAppServeEnabled) {
    // eslint-disable-next-line no-console
    console.warn('Building application for web-app-serve');
}
const overrideDefine = webAppServeEnabled
    ? overrideDefineForWebAppServe
    : undefined;

export default defineConfig({
    overrideDefine,
    validator: 'builtin',
    schema: {
        // NOTE: These are the dynamic env variables
        APP_GRAPHQL_ENDPOINT: Schema.string({ format: 'url', protocol: true, tld: false }),
        APP_BACKEND_ENDPOINT: Schema.string({ format: 'url', protocol: true, tld: false }),
        APP_SENTRY_DSN: Schema.string.optional(),
        APP_ENVIRONMENT: (key: string, value: string) => {
            // FIXME: APP_ENVIRONMENT_PLACEHOLDER might not be required
            // NOTE: APP_ENVIRONMENT_PLACEHOLDER is meant to be used with image builds
            // The value will be later replaced with the actual value
            const regex = /^PROD|STAGE|testing|ci|alpha-\d+|ALPHA-\d+|DEV|APP_ENVIRONMENT_PLACEHOLDER$/;
            const valid = !!value && (value.match(regex) !== null);
            if (!valid) {
                throw new Error(`Value for environment variable "${key}" must match regex "${regex}", instead received "${value}"`);
            }
            if (value === 'APP_ENVIRONMENT_PLACEHOLDER') {
                console.warn(`Using ${value} for app environment. Make sure to not use this for builds without nginx-serve`);
            }
            return value as ('PROD' | 'STAGE' | 'testing' | 'ci' | `alpha-${number}` | 'DEV' | 'APP_ENVIRONMENT_PLACEHOLDER' | `ALPHA-${number}`);
        },
        APP_GA_TRACKING_ID: Schema.string.optional(),
        APP_GRAPHQL_CODEGEN_ENDPOINT: Schema.string(),
    },
});
