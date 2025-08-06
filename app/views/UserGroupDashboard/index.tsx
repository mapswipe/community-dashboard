import React, {
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useParams } from 'react-router';
import {
    gql,
    useLazyQuery,
    useQuery,
} from '@apollo/client';
import {
    encodeDate,
    isFalsyString,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import { MapContributionType } from '#components/ContributionHeatMap';
import { getThisYear } from '#components/DateRangeInput/predefinedDateRange';
import Heading from '#components/Heading';
import List from '#components/List';
import MemberItem from '#components/MemberItem';
import Page from '#components/Page';
import Pager from '#components/Pager';
import {
    FilteredUserGroupStatsQuery,
    FilteredUserGroupStatsQueryVariables,
    UserGroupStatsQuery,
    UserGroupStatsQueryVariables,
    UserMembershipsExportQuery,
    UserMembershipsExportQueryVariables,
} from '#generated/types';
import useUrlState from '#hooks/useUrlState';
import { defaultPagePerItemOptions } from '#utils/common';
import StatsBoard from '#views/StatsBoard';

import styles from './styles.module.css';

const EXPORT_LIMIT = 500;

const USER_GROUP_STATS = gql`
query UserGroupStats($pk: ID!, $limit: Int!, $offset: Int!) {
    contributorUserGroup(id: $pk) {
        id
        name
        description
        membersCount
        userMemberships(pagination: {limit: $limit, offset: $offset}) {
            totalCount
            results {
                id
                isActive
                totalSwipes
                totalSwipeTime
                totalMappingProjects
                user {
                    id
                    firebaseId
                    username
                }
            }
        }
    }
    communityUserGroupStats(userGroupId: $pk) {
        id
        stats {
            totalContributors
            totalSwipes
            totalSwipeTime
        }
        statsLatest {
            totalContributors
            totalSwipes
            totalSwipeTime
        }
    }
}
`;

const FILTERED_USER_GROUP_STATS = gql`
    query FilteredUserGroupStats($pk: ID!, $fromDate: Date! $toDate: Date!) {
        communityUserGroupStats(userGroupId: $pk) {
            id
            filteredStats(dateRange: {fromDate: $fromDate, toDate: $toDate}) {
                areaSwipedByProjectType {
                    projectTypeDisplay
                    totalArea
                    projectType
                }
                swipeByDate {
                    taskDate
                    totalSwipes
                }
                swipeByOrganizationName {
                    totalSwipes
                    organizationName
                }
                swipeByProjectGeo {
                    totalContribution
                    geojson
                }
                swipeByProjectType {
                    totalSwipes
                    projectTypeDisplay
                    projectType
                }
                swipeTimeByDate {
                    totalSwipeTime
                    date
                }
            }
        }
    }
`;

const USER_MEMBERSHIPS_EXPORT = gql`
    query UserMembershipsExport(
        $pk: ID!,
        $limit: Int!,
        $offset: Int!,
    ) {
        contributorUserGroup(id: $pk) {
            id
            name
            description
            membersCount
            userMemberships(pagination: {limit: $limit, offset: $offset}) {
                totalCount
                results {
                    id
                    isActive
                    totalSwipes
                    totalSwipeTime
                    totalMappingProjects
                    user {
                        id
                        firebaseId
                        username
                    }
                }
            }
        }
    }
`;

type UserGroupMember = NonNullable<NonNullable<NonNullable<UserGroupStatsQuery['contributorUserGroup']>['userMemberships']>['results']>[number];

function memberKeySelector(member: UserGroupMember) {
    return member.user.firebaseId;
}

interface DateRangeValue {
    startDate: string;
    endDate: string;
}

const { startDate, endDate } = getThisYear();
const defaultDateRange: DateRangeValue = {
    startDate: encodeDate(startDate),
    endDate: encodeDate(endDate),
};
interface Props {
    className?: string;
}

type UserMembershipType = NonNullable<NonNullable<UserMembershipsExportQuery['contributorUserGroup']>['userMemberships']>['results'];

function UserGroupDashboard(props: Props) {
    const { className } = props;

    const { userGroupId } = useParams<{ userGroupId: string | undefined }>();
    const [userMembershipsData, setUserMembershipsData] = useState<UserMembershipType>([]);
    const [exportPending, setExportPending] = useState<boolean>(false);

    const [
        dateRange,
        setDateRange,
    ] = useUrlState<DateRangeValue>(
        (params) => {
            if (!params.from || !params.to) {
                return defaultDateRange;
            }

            return {
                startDate: params.from,
                endDate: params.to,
            };
        },
        (value) => ({
            from: value?.startDate,
            to: value?.endDate,
        }),
    );

    const [activePage, setActivePage] = React.useState(1);
    const [pagePerItem, setPagePerItem] = React.useState(10);
    const [offset, setOffset] = useState<number>(EXPORT_LIMIT);

    const {
        data: userGroupStats,
        loading: userGroupStatsLoading,
    } = useQuery<UserGroupStatsQuery, UserGroupStatsQueryVariables>(
        USER_GROUP_STATS,
        {
            variables: userGroupId ? {
                pk: userGroupId,
                limit: pagePerItem,
                offset: (activePage - 1) * pagePerItem,
            } : undefined,
            skip: !userGroupId,
        },
    );

    const userGroupExportVariable = useMemo((): UserMembershipsExportQueryVariables | undefined => (
        userGroupId ? {
            pk: userGroupId,
            limit: EXPORT_LIMIT,
            offset: 0,
        } : undefined
    ), [userGroupId]);

    const [
        exportUserMembership,
    ] = useLazyQuery<UserMembershipsExportQuery, UserGroupStatsQueryVariables>(
        USER_MEMBERSHIPS_EXPORT,
        {
            variables: userGroupExportVariable,
            onCompleted: (response) => {
                const result = response?.contributorUserGroup?.userMemberships;
                // eslint-disable-next-line max-len
                const userMembershipsCount = response?.contributorUserGroup?.userMemberships?.totalCount ?? 0;
                const newUserMembershipsData = [...userMembershipsData, ...(result?.results ?? [])];

                if (newUserMembershipsData?.length < userMembershipsCount) {
                    setExportPending(true);
                    exportUserMembership({
                        variables: userGroupId ? ({
                            pk: userGroupId,
                            limit: EXPORT_LIMIT,
                            offset,
                        }) : undefined,
                    });
                }

                if (newUserMembershipsData.length === userMembershipsCount) {
                    const userGroupData = [
                        ['User', 'Total swipes', 'Project contributed', 'Time spent(mins)'],
                        ...(newUserMembershipsData?.map((user) => (
                            [
                                // eslint-disable-next-line max-len
                                isFalsyString(user.user.username) ? user.user.firebaseId : user.user.username,
                                user.totalSwipes,
                                user.totalMappingProjects,
                                user.totalSwipeTime,
                            ]
                        )) ?? []),
                    ];
                    let csvContent = '';
                    userGroupData.forEach((row) => {
                        csvContent += `${row.join(',')} \n`;
                    });
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' });
                    const objUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = objUrl;
                    link.download = `${userGroupStats?.contributorUserGroup?.name ?? 'users'}.csv`;
                    document.body.appendChild(link);
                    link.dispatchEvent(
                        new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                        }),
                    );
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(objUrl);
                    setExportPending(false);
                }
                setOffset((prevValue) => prevValue + EXPORT_LIMIT);
                setUserMembershipsData(() => newUserMembershipsData);
            },
            onError: (err) => {
                // NOTE: we don't show any alert on failure and success for now
                // eslint-disable-next-line no-console
                console.log('some error ocoured', err);
            },
        },
    );

    const {
        data: filteredUserGroupStats,
        loading: filteredUserGroupStatsLoading,
    } = useQuery<FilteredUserGroupStatsQuery, FilteredUserGroupStatsQueryVariables>(
        FILTERED_USER_GROUP_STATS,
        {
            variables: userGroupId ? {
                pk: userGroupId,
                fromDate: dateRange.startDate,
                toDate: dateRange.endDate,
            } : undefined,
            skip: !userGroupId,
        },
    );

    const memberList = userGroupStats?.contributorUserGroup?.userMemberships?.results;
    const totalMembers = userGroupStats?.contributorUserGroup?.membersCount ?? 0;

    const memberRendererParams = useCallback((_: string, item: UserGroupMember) => (
        {
            member: {
                totalMappingProjects: item.totalMappingProjects,
                totalSwipeTime: item.totalSwipeTime,
                totalSwipes: item.totalSwipes,
                isActive: item.isActive,
                username: item.user.username,
                userId: item.user.firebaseId,
            },
        }
    ), []);

    const setDateRangeSafe = React.useCallback((newValue: DateRangeValue | undefined) => {
        setDateRange(newValue ?? defaultDateRange);
    }, [setDateRange]);

    const totalSwipes = userGroupStats?.communityUserGroupStats?.stats?.totalSwipes ?? 0;

    // eslint-disable-next-line max-len
    const totalSwipesLastMonth = userGroupStats?.communityUserGroupStats?.statsLatest?.totalSwipes ?? 0;

    const totalSwipeTime = userGroupStats?.communityUserGroupStats?.stats?.totalSwipeTime ?? 0;
    // eslint-disable-next-line max-len
    const totalSwipeTimeLastMonth = userGroupStats?.communityUserGroupStats?.statsLatest?.totalSwipeTime ?? 0;

    // eslint-disable-next-line max-len
    const totalContributors = userGroupStats?.communityUserGroupStats?.stats?.totalContributors ?? 0;
    // eslint-disable-next-line max-len
    const totalContributorsLastMonth = userGroupStats?.communityUserGroupStats?.statsLatest?.totalContributors ?? 0;

    const filteredStats = filteredUserGroupStats?.communityUserGroupStats?.filteredStats;

    return (
        <Page
            className={className}
            variant="userGroup"
            heading={userGroupStats?.contributorUserGroup?.name}
            totalSwipes={totalSwipes}
            totalSwipesLastMonth={totalSwipesLastMonth}
            totalTimeSpent={totalSwipeTime}
            totalTimeSpentLastMonth={totalSwipeTimeLastMonth}
            totalContributors={totalContributors}
            totalContributorsLastMonth={totalContributorsLastMonth}
            pending={userGroupStatsLoading || filteredUserGroupStatsLoading}
            content={(
                <StatsBoard
                    heading="Group Statsboard"
                    contributionSwipeStats={filteredStats?.swipeByDate}
                    contributionTimeStats={filteredStats?.swipeTimeByDate}
                    areaSwipedByProjectType={filteredStats?.areaSwipedByProjectType}
                    organizationTypeStats={filteredStats?.swipeByOrganizationName}
                    swipeByProjectType={filteredStats?.swipeByProjectType}
                    dateRange={dateRange}
                    handleDateRangeChange={setDateRangeSafe}
                    contributions={filteredStats?.swipeByProjectGeo as MapContributionType[]}
                />
            )}
            additionalContent={totalMembers > 0 && (
                <div className={styles.members}>
                    <div className={styles.membersHeading}>
                        <Heading size="extraLarge">
                            Group Members
                        </Heading>
                        <Button
                            disabled={exportPending}
                            onClick={exportUserMembership}
                            name={undefined}
                        >
                            { exportPending ? 'Exporting' : 'Export' }
                        </Button>
                    </div>
                    <div className={styles.membersContainer}>
                        <div className={styles.memberListHeading}>
                            <div className={styles.tableHeading}>
                                User
                            </div>
                            <div className={styles.tableHeading}>
                                Total Swipes
                            </div>
                            <div className={styles.tableHeading}>
                                Project contributed
                            </div>
                            <div className={styles.tableHeading}>
                                Time Spent
                            </div>
                        </div>
                        <List
                            data={memberList}
                            keySelector={memberKeySelector}
                            renderer={MemberItem}
                            rendererParams={memberRendererParams}
                        />
                    </div>
                    <Pager
                        pagePerItem={pagePerItem}
                        onPagePerItemChange={setPagePerItem}
                        activePage={activePage}
                        onActivePageChange={setActivePage}
                        totalItems={totalMembers}
                        pagePerItemOptions={defaultPagePerItemOptions}
                    />
                </div>
            )}
        />
    );
}

export default UserGroupDashboard;
