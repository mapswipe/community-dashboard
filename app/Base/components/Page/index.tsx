import React from 'react';

import ErrorBoundary from '#base/components/ErrorBoundary';
import PageTitle from '#base/components/PageTitle';

import styles from './styles.module.css';

type Visibility = 'is-authenticated' | 'is-not-authenticated' | 'is-anything';

export interface Props<T extends { className?: string }> {
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.LazyExoticComponent<(props: T) => React.ReactElement<any, any> | null>;
    componentProps: React.PropsWithRef<T>;
    overrideProps: Partial<React.PropsWithRef<T>>;
    visibility: Visibility,
    checkPermissions?: (
        skipProjectPermissionCheck: boolean,
    ) => boolean | undefined,
    navbarVisibility: boolean;

    path: string;
    defaultPage?: string;
}

function Page<T extends { className?: string }>(props: Props<T>) {
    const {
        component: Comp,
        componentProps,
        overrideProps,
        title,
    } = props;

    return (
        <>
            <PageTitle value={title} />
            <ErrorBoundary>
                <Comp
                    className={styles.page}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...componentProps}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...overrideProps}
                />
            </ErrorBoundary>
        </>
    );
}

export default Page;
