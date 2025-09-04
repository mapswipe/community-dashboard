import React, { useMemo } from 'react';
import {
    generatePath,
    Link,
    useParams,
} from 'react-router';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    encodeDate,
    isDefined,
    isFalsyString,
} from '@togglecorp/fujs';

import routes from '#base/configs/routes';
import { MapContributionType } from '#components/ContributionHeatMap';
import { getThisYear } from '#components/DateRangeInput/predefinedDateRange';
import Heading from '#components/Heading';
import InformationCard from '#components/InformationCard';
import Page from '#components/Page';
import Pager from '#components/Pager';
import {
    FilteredUserStatsQuery,
    FilteredUserStatsQueryVariables,
    UserStatsQuery,
    UserStatsQueryVariables,
} from '#generated/types/graphql';
import useUrlState from '#hooks/useUrlState';
import groupSvg from '#resources/icons/group.svg';
import { defaultPagePerItemOptions } from '#utils/common';
import StatsBoard from '#views/StatsBoard';

import styles from './styles.module.css';

const USER_STATS = gql`
    query UserStats($pk: ID!, $limit: Int!, $offset: Int!) {
        contributorUserByFirebaseId(firebaseId: $pk) {
            id
            firebaseId
            username
        }
        communityUserStats(firebaseId: $pk) {
            id
            stats {
                totalSwipes
                totalSwipeTime
            }
            statsLatest {
                totalSwipes
                totalSwipeTime
                totalUserGroups
            }
        }
        contributorUserGroups(
            pagination: {limit: $limit, offset: $offset}
            filters: {firebaseId: $pk}
        ) {
            results {
                id
                name
                membersCount
            }
            totalCount
        }
    }
`;

const FILTERED_USER_STATS = gql`
    query FilteredUserStats($pk: ID!, $fromDate: Date!, $toDate: Date!) {
        communityUserStats(firebaseId: $pk) {
            id
            filteredStats(dateRange: {fromDate: $fromDate, toDate: $toDate}) {
                id
                areaSwipedByProjectType {
                    totalArea
                    projectType
                    projectTypeDisplay
                }
                swipeByProjectGeo {
                    geojson
                    totalContribution
                }
                swipeByDate {
                    taskDate
                    totalSwipes
                }
                swipeByOrganizationName {
                    organizationName
                    totalSwipes
                }
                swipeByProjectType {
                    projectType
                    projectTypeDisplay
                    totalSwipes
                }
                swipeTimeByDate {
                    date
                    totalSwipeTime
                }
            }
        }
    }
`;

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

function UserDashboard(props: Props) {
    const { className } = props;

    const { userId } = useParams<{ userId: string | undefined }>();
    const [
        dateRange = defaultDateRange,
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

    const {
        data: userStats,
        loading: userStatsLoading,
    } = useQuery<UserStatsQuery, UserStatsQueryVariables>(
        USER_STATS,
        {
            variables: userId ? {
                pk: userId,
                limit: pagePerItem,
                offset: (activePage - 1) * pagePerItem,
            } : undefined,
            skip: !userId,
        },
    );

    const {
        data: filteredUserStats,
        loading: filteredUserStatsLoading,
    } = useQuery<FilteredUserStatsQuery, FilteredUserStatsQueryVariables>(
        FILTERED_USER_STATS,
        {
            variables: userId ? {
                pk: userId,
                fromDate: dateRange.startDate,
                toDate: dateRange.endDate,
            } : undefined,
            skip: !userId,
        },
    );

    const setDateRangeSafe = React.useCallback((newValue: DateRangeValue | undefined) => {
        setDateRange(newValue ?? defaultDateRange);
    }, [setDateRange]);

    const totalSwipes = userStats?.communityUserStats?.stats?.totalSwipes;
    const totalSwipesLastMonth = userStats?.communityUserStats?.statsLatest?.totalSwipes;

    const totalSwipeTime = userStats?.communityUserStats?.stats?.totalSwipeTime;
    const totalSwipeTimeLastMonth = userStats?.communityUserStats?.statsLatest?.totalSwipeTime;

    const totalUserGroup = userStats?.contributorUserGroups?.totalCount ?? 0;
    const totalUserGroupLastMonth = userStats?.communityUserStats?.statsLatest?.totalUserGroups;

    const userGroupsLength = userStats?.contributorUserGroups?.results?.length ?? 0;
    const excessUserGroups = Array.from(new Array((3 - ((userGroupsLength) % 3)) % 3).keys());

    const filteredStats = filteredUserStats?.communityUserStats?.filteredStats;

    // NOTE: OSM user does not have username stored
    const userName = useMemo(() => {
        if (isDefined(userStats) && isDefined(userStats.contributorUserByFirebaseId)) {
            return isFalsyString(userStats.contributorUserByFirebaseId.username)
                ? userStats.contributorUserByFirebaseId.firebaseId
                : userStats.contributorUserByFirebaseId.username;
        }

        return null;
    }, [userStats]);

    return (
        <Page
            className={className}
            variant="user"
            heading={userName}
            totalSwipes={totalSwipes}
            totalSwipesLastMonth={totalSwipesLastMonth}
            totalTimeSpent={totalSwipeTime}
            totalTimeSpentLastMonth={totalSwipeTimeLastMonth}
            groupsJoined={totalUserGroup}
            activeInGroupsLastMonth={totalUserGroupLastMonth}
            pending={userStatsLoading || filteredUserStatsLoading}
            content={(
                <StatsBoard
                    heading="User Statsboard"
                    dateRange={dateRange}
                    handleDateRangeChange={setDateRangeSafe}
                    contributionSwipeStats={filteredStats?.swipeByDate}
                    contributionTimeStats={filteredStats?.swipeTimeByDate}
                    areaSwipedByProjectType={filteredStats?.areaSwipedByProjectType}
                    organizationTypeStats={filteredStats?.swipeByOrganizationName}
                    swipeByProjectType={filteredStats?.swipeByProjectType}
                    // eslint-disable-next-line max-len
                    contributions={filteredStats?.swipeByProjectGeo as MapContributionType[] | undefined}
                />
            )}
            additionalContent={totalUserGroup > 0 && (
                <div className={styles.groups}>
                    <Heading size="extraLarge">
                        Current Groups
                    </Heading>
                    <div className={styles.groupsContainer}>
                        {userStats?.contributorUserGroups?.results?.map((group) => (
                            <InformationCard
                                key={group.id}
                                className={styles.group}
                                icon={(<img src={groupSvg} alt="swipe icon" />)}
                                // subHeading={(
                                //     <TextOutput
                                //         className={styles.value}
                                //         label="Joined on"
                                //         // FIXME: fill this value
                                //         value={undefined}
                                //         hideLabelColon
                                //     />
                                // )}
                                label={(
                                    <Link
                                        className={styles.link}
                                        to={generatePath(
                                            routes.userGroupDashboard.path,
                                            { userGroupId: group.id },
                                        )}
                                    >
                                        {group.name}
                                    </Link>
                                )}
                                description={
                                    `${group.membersCount} ${group.membersCount > 1
                                        ? 'members'
                                        : 'member'
                                    }`
                                }
                            />
                        ))}
                        {excessUserGroups.map(
                            (key) => <div key={key} className={styles.group} />,
                        )}
                    </div>
                    <Pager
                        pagePerItem={pagePerItem}
                        onPagePerItemChange={setPagePerItem}
                        activePage={activePage}
                        onActivePageChange={setActivePage}
                        totalItems={totalUserGroup}
                        pagePerItemOptions={defaultPagePerItemOptions}
                    />
                </div>
            )}
        />
    );
}

export default UserDashboard;
