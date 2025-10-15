import React, {
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    IoCheckmark,
    IoPeople,
    IoPerson,
    IoSearch,
} from 'react-icons/io5';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    _cs,
    isFalsyString,
} from '@togglecorp/fujs';

import SearchSelectInput, { SearchSelectInputProps } from '#components/SelectInput/SearchSelectInput';
import {
    UserGroupOptionsQuery,
    UserGroupOptionsQueryVariables,
    UserOptionsQuery,
    UserOptionsQueryVariables,
} from '#generated/types/graphql';
import useDebouncedValue from '#hooks/useDebouncedValue';

import styles from './styles.module.css';

export type SearchItemType = {
    id: string;
    name: string;
    type: 'user' | 'user-group',
    isArchived?: boolean,
};

const LIMIT = 5;

const USERS = gql`
query UserOptions($search: String, $offset: Int!, $limit: Int!) {
    contributorUsers(
        filters: {
            username: { iContains: $search }
        },
        pagination: {
            limit: $limit,
            offset: $offset
        }
    ) {
        results {
            id
            firebaseId
            username
        }
        pageInfo {
            limit
            offset
        }
        totalCount
    }
}
`;

const USER_GROUPS = gql`
query UserGroupOptions($search: String, $offset: Int!, $limit: Int!) {
    contributorUserGroups(
        filters: {
            name: $search
        }
        pagination: {
            limit: $limit,
            offset: $offset
        }
    ) {
        results {
            id
            firebaseId
            isArchived
            clientId
            name
        }
        totalCount
        pageInfo {
            limit
            offset
        }
    }
}
`;

interface OptionRendererProps {
    title: string;
    isArchived: boolean;
    type: string;
}

type BaseProps<Name extends string> = SearchSelectInputProps<
    string,
    Name,
    SearchItemType,
    OptionRendererProps,
    ''
>;

type ItemSelectInputProps<Name extends string> = {
    className?: string;
    onItemSelect: (item: SearchItemType | undefined) => void;
    labelContainerClassName?: BaseProps<Name>['labelContainerClassName'];
    placeholder: BaseProps<Name>['placeholder'];
};

const keySelector = (d: SearchItemType) => d.id;

const isArchivedSelector = (d: SearchItemType) => d.isArchived ?? false;

const typeSelector = (d: SearchItemType) => d.type;

interface OptionProps {
    label: React.ReactNode;
    isArchived: boolean;
    type: string;
}

function Option(props: OptionProps) {
    const {
        label,
        isArchived,
        type,
    } = props;

    return (
        <div className={styles.optionItem}>
            <div className={styles.checkmark}>
                <IoCheckmark />
            </div>
            <div className={styles.name}>
                {type === 'user' && (
                    <IoPerson className={styles.icon} />
                )}
                {type === 'user-group' && (
                    <IoPeople className={styles.icon} />
                )}
                <div className={styles.label}>
                    {label}
                </div>
            </div>
            <div className={styles.meta}>
                {isArchived && (
                    <div>
                        Archived
                    </div>
                )}
            </div>
        </div>
    );
}

function titleSelector(item: SearchItemType) {
    return item.name;
}

function ItemSelectInput<Name extends string>(props: ItemSelectInputProps<Name>) {
    const {
        className,
        onItemSelect,
        ...otherProps
    } = props;

    const [opened, setOpened] = useState(false);
    const [searchText, setSearchText] = useState<string>('');
    const debouncedSearchText = useDebouncedValue(searchText);

    const variables = useMemo(() => ({
        search: debouncedSearchText,
        offset: 0,
        limit: LIMIT,
    }), [debouncedSearchText]);

    const {
        previousData: previousUserData,
        data: userData = previousUserData,
        loading: userDataLoading,
        fetchMore: fetchMoreUser,
    } = useQuery<UserOptionsQuery, UserOptionsQueryVariables>(
        USERS,
        {
            variables,
            skip: !opened,
        },
    );

    const {
        previousData: previousUserGroupData,
        data: userGroupData = previousUserGroupData,
        loading: userGroupDataLoading,
        fetchMore: fetchMoreUserGroup,
    } = useQuery<UserGroupOptionsQuery, UserGroupOptionsQueryVariables>(
        USER_GROUPS,
        {
            variables,
            skip: !opened,
        },
    );

    const loading = userDataLoading || userGroupDataLoading;
    const count = (userData?.contributorUsers.totalCount ?? 0)
        + (userGroupData?.contributorUserGroups.totalCount ?? 0);
    const usersData = useMemo(
        () => userData?.contributorUsers.results,
        [userData?.contributorUsers.results],
    );
    const userGroupsData = useMemo(
        () => userGroupData?.contributorUserGroups.results,
        [userGroupData?.contributorUserGroups.results],
    );

    const data: SearchItemType[] = useMemo(
        () => ([
            ...(usersData?.map((user) => ({
                id: user.firebaseId,
                name: (isFalsyString(user.username) ? user.firebaseId : user.username),
                type: 'user' as const,
            })) ?? []),
            ...(userGroupsData?.map((userGroup) => ({
                id: userGroup.firebaseId,
                name: userGroup.name ?? 'Unknown',
                type: 'user-group' as const,
                isArchived: userGroup.isArchived ?? false,
            })) ?? []),
        ]),
        [userGroupsData, usersData],
    );

    const handleSelectItem = useCallback(
        (id: string | undefined) => {
            const item = data.find((val) => val.id === id);
            onItemSelect(item);
        },
        [data, onItemSelect],
    );

    const optionRendererParams = useCallback(
        (_: number | string, option: SearchItemType) => {
            const isActive = false;

            return {
                label: titleSelector(option),
                isArchived: isArchivedSelector(option),
                type: typeSelector(option),
                containerClassName: _cs(styles.optionContainer, isActive && styles.active),
            };
        },
        [],
    );

    const handleShowMoreClick = useCallback(() => {
        fetchMoreUser({
            variables: {
                offset: (userData?.contributorUsers.pageInfo.offset ?? 0) + LIMIT,
            },
            updateQuery: (previousResult, { fetchMoreResult }) => {
                const oldUsers = previousResult;
                const newUsers = fetchMoreResult;

                if (!newUsers) {
                    return previousResult;
                }

                return ({
                    contributorUsers: {
                        ...newUsers.contributorUsers,
                        results: [
                            ...oldUsers.contributorUsers?.results ?? [],
                            ...newUsers.contributorUsers?.results ?? [],
                        ],
                    },
                });
            },
        });
        fetchMoreUserGroup({
            variables: {
                offset: (userGroupData?.contributorUserGroups.pageInfo.offset ?? 0) + LIMIT,
            },
            updateQuery: (previousResult, { fetchMoreResult }) => {
                const oldUserGroups = previousResult;
                const newUserGroups = fetchMoreResult;

                if (!newUserGroups) {
                    return previousResult;
                }

                return ({
                    contributorUserGroups: {
                        ...newUserGroups.contributorUserGroups,
                        results: [
                            ...oldUserGroups.contributorUserGroups.results ?? [],
                            ...newUserGroups.contributorUserGroups.results ?? [],
                        ],
                    },
                });
            },
        });
    }, [
        fetchMoreUser,
        fetchMoreUserGroup,
        userData?.contributorUsers.pageInfo.offset,
        userGroupData?.contributorUserGroups.pageInfo.offset,
    ]);

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            className={className}
            name="item-select-input"
            icons={(
                <IoSearch />
            )}
            optionRendererParams={optionRendererParams}
            optionRenderer={Option}
            options={[]}
            value={undefined}
            onChange={handleSelectItem}
            keySelector={keySelector}
            labelSelector={titleSelector}
            onSearchValueChange={setSearchText}
            onShowDropdownChange={setOpened}
            searchOptions={data}
            optionsPending={loading}
            totalOptionsCount={count}
            handleShowMoreClick={handleShowMoreClick}
        />
    );
}

export default ItemSelectInput;
