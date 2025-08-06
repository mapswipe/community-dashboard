import { Suspense } from 'react';
import {
    Route,
    Routes,
} from 'react-router';
import { withSentryReactRouterV7Routing } from '@sentry/react';

import PreloadMessage from '#base/components/PreloadMessage';
import routes from '#base/configs/routes';

const RoutesWithSentry = withSentryReactRouterV7Routing(Routes);

interface Props {
    className?: string;
}

function AppRoutes(props: Props) {
    const { className } = props;

    return (
        <Suspense
            fallback={(
                <PreloadMessage
                    className={className}
                    content="Loading page..."
                />
            )}
        >
            <RoutesWithSentry>
                <Route
                    path={routes.home.path}
                    element={routes.home.load({ className })}
                />
                <Route
                    path={routes.userGroupDashboard.path}
                    element={routes.userGroupDashboard.load({ className })}
                />
                <Route
                    path={routes.userDashboard.path}
                    element={routes.userDashboard.load({ className })}
                />
                <Route
                    path={routes.fourHundredFour.path}
                    element={routes.fourHundredFour.load({ className })}
                />
            </RoutesWithSentry>
        </Suspense>
    );
}
export default AppRoutes;
