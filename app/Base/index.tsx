import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import ReactGA from 'react-ga';
import { BrowserRouter } from 'react-router';
import {
    ApolloClient,
    ApolloProvider,
} from '@apollo/client';
import {
    ErrorBoundary,
    init,
} from '@sentry/react';
import { _cs } from '@togglecorp/fujs';

import Navbar from '#base/components/Navbar';
import PreloadMessage from '#base/components/PreloadMessage';
import Routes from '#base/components/Routes';
import apolloConfig from '#base/configs/apollo';
import {
    gaConfig,
    trackingId,
} from '#base/configs/googleAnalytics';
import sentryConfig from '#base/configs/sentry';
import {
    NavbarContext,
    NavbarContextInterface,
} from '#base/context/NavbarContext';

import styles from './styles.module.css';

if (sentryConfig) {
    init(sentryConfig);
}

if (trackingId) {
    ReactGA.initialize(trackingId, gaConfig);
    const page = window.location.pathname;
    ReactGA.set({ page });
    ReactGA.pageview(page);
}

const apolloClient = new ApolloClient(apolloConfig);
const BACKEND_ENDPOINT = import.meta.env.APP_BACKEND_ENDPOINT;

function Base() {
    useEffect(() => {
        async function healthCheck() {
            try {
                await fetch(
                    `${BACKEND_ENDPOINT}health-check/?format=json`,
                    { credentials: 'include' },
                );
            } catch (ex) {
                // eslint-disable-next-line no-console
                console.error('Error getting health check', ex);
            }
        }
        healthCheck();
    }, []);

    const [navbarVisibility, setNavbarVisibility] = useState(true);

    const navbarContext: NavbarContextInterface = useMemo(
        () => ({
            navbarVisibility,
            setNavbarVisibility,
        }),
        [navbarVisibility, setNavbarVisibility],
    );

    return (
        <div className={styles.base}>
            <ErrorBoundary
                showDialog
                fallback={(
                    <PreloadMessage
                        heading="Oh no!"
                        content="Some error occurred!"
                    />
                )}
            >
                <ApolloProvider client={apolloClient}>
                    <NavbarContext.Provider value={navbarContext}>
                        <BrowserRouter>
                            <Navbar
                                className={_cs(
                                    styles.navbar,
                                    !navbarVisibility && styles.hidden,
                                )}
                            />
                            <Routes
                                className={styles.view}
                            />
                        </BrowserRouter>
                    </NavbarContext.Provider>
                </ApolloProvider>
            </ErrorBoundary>
        </div>
    );
}

export default Base;
