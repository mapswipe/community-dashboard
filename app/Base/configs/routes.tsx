import { lazy } from 'react';

import { wrap } from '#base/utils/routes';

const fourHundredFour = wrap({
    path: '*',
    title: '404',
    component: lazy(() => import('#views/FourHundredFour')),
    componentProps: {},
    visibility: 'is-anything',
    navbarVisibility: true,
});

const home = wrap({
    path: '/',
    title: 'Community',
    navbarVisibility: true,
    component: lazy(() => import('#views/Dashboard')),
    componentProps: {},
    visibility: 'is-authenticated',
});

const userGroupDashboard = wrap({
    path: '/user-group/:userGroupId/',
    title: 'UserGroup',
    navbarVisibility: true,
    component: lazy(() => import('#views/UserGroupDashboard')),
    componentProps: {},
    visibility: 'is-authenticated',
});

const userDashboard = wrap({
    path: '/user/:userId/',
    title: 'User',
    navbarVisibility: true,
    component: lazy(() => import('#views/UserDashboard')),
    componentProps: {},
    visibility: 'is-authenticated',
});

const routes = {
    home,
    userGroupDashboard,
    userDashboard,
    fourHundredFour,
};
export default routes;
