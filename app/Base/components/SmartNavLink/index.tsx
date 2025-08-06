import React from 'react';
import {
    NavLink,
    NavLinkProps,
} from 'react-router';
import { _cs } from '@togglecorp/fujs';

import useRouteMatching, {
    Attrs,
    RouteData,
} from '#base/hooks/useRouteMatching';

import styles from './styles.module.css';

export type Props = Omit<NavLinkProps, 'to'> & {
    route: RouteData;
    attrs?: Attrs;
    children?: React.ReactNode;
    className?: string;
    activeClassName?: string;
};

function SmartNavLink(props: Props) {
    const {
        route,
        attrs,
        children,
        className,
        activeClassName,
        ...otherProps
    } = props;

    const routeData = useRouteMatching(route, attrs);
    if (!routeData) {
        return null;
    }

    return (
        <NavLink
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            to={routeData.to}
            className={({ isActive }) => _cs(
                styles.smartNavLink,
                isActive && styles.active,
                className,
                isActive && activeClassName,
            )}
        >
            {children ?? routeData.children}
        </NavLink>
    );
}

export default SmartNavLink;
