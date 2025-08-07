import React, {
    memo,
    useMemo,
} from 'react';
import {
    isNotDefined,
    listToGroupList,
} from '@togglecorp/fujs';

export const typedMemo: (<T>(c: T) => T) = memo;

type OptionKey = string | number;

const emptyList: unknown[] = [];

export interface GroupCommonProps {
    className?: string;
    children: React.ReactNode;
}

interface BaseProps<D, P, K extends OptionKey> {
    data: D[] | undefined;
    keySelector(datum: D, index: number): K;
    renderer: (props: P) => JSX.Element;
    rendererClassName?: string;
    rendererParams: (key: K, datum: D, index: number, data: D[]) => P;
}

interface GroupOptions<D, GP, GK extends OptionKey> {
    groupComparator?: (a: GK, b: GK) => number;
    groupKeySelector(datum: D): GK;

    groupRenderer: (props: GP) => JSX.Element;
    groupRendererClassName?: string;
    groupRendererParams: (key: GK, index: number, data: D[]) => Omit<GP, 'children' | 'className'>;
    grouped: true;
}

interface NoGroupOptions {
    grouped?: false;
}

export type ListProps<D, P, K extends OptionKey, GP, GK extends OptionKey> = (
    BaseProps<D, P, K> & (GroupOptions<D, GP, GK> | NoGroupOptions)
);

export type GroupedListProps<D, P, K extends OptionKey, GP, GK extends OptionKey> = (
    BaseProps<D, P, K> & GroupOptions<D, GP, GK>
);

function hasGroup<D, P, K extends OptionKey, GP, GK extends OptionKey>(
    props: ListProps<D, P, K, GP, GK>,
): props is (BaseProps<D, P, K> & GroupOptions<D, GP, GK>) {
    return !!(props as BaseProps<D, P, K> & GroupOptions<D, GP, GK>).grouped;
}

// eslint-disable-next-line react-refresh/only-export-components
function GroupedList<D, P, K extends OptionKey, GP extends GroupCommonProps, GK extends OptionKey>(
    props: GroupedListProps<D, P, K, GP, GK>,
) {
    const {
        groupKeySelector,
        groupComparator,
        renderer: Renderer,
        groupRenderer: GroupRenderer,
        groupRendererClassName,
        groupRendererParams,
        data: dataFromProps,
        keySelector,
        rendererParams,
        rendererClassName,
    } = props;

    const data = dataFromProps ?? (emptyList as D[]);

    const renderListItem = (datum: D, i: number) => {
        const key = keySelector(datum, i);
        const extraProps = rendererParams(key, datum, i, data);

        return (
            <Renderer
                key={key}
                className={rendererClassName}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...extraProps}
            />
        );
    };

    const renderGroup = (
        groupKey: GK,
        index: number,
        groupData: D[],
        children: React.ReactNode,
    ) => {
        const extraProps = groupRendererParams(groupKey, index, groupData);

        const finalProps = {
            ...extraProps,
            className: groupRendererClassName,
            children,
        };

        return (
            <GroupRenderer
                key={groupKey}
                // FIXME: currently typescript is not smart enough to join Omit
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...finalProps as GP}
            />
        );
    };

    const groups = useMemo(
        () => listToGroupList(data, groupKeySelector),
        [data, groupKeySelector],
    );

    const sortedGroupKeys = useMemo(
        () => {
            const keys = Object.keys(groups) as GK[];
            return keys.sort(groupComparator);
        },
        [groups, groupComparator],
    );

    const children: React.ReactNode[] = sortedGroupKeys.map((groupKey, i) => (
        renderGroup(groupKey, i, groups[groupKey], groups[groupKey].map(renderListItem))
    ));

    return (
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <>
            { children }
        </>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
function List<D, P, K extends OptionKey, GP extends GroupCommonProps, GK extends OptionKey>(
    props: ListProps<D, P, K, GP, GK>,
) {
    const {
        data,
        keySelector,
        renderer: Renderer,
        rendererClassName,
        rendererParams,
    } = props;

    if (isNotDefined(data)) {
        return null;
    }

    const renderListItem = (datum: D, i: number) => {
        const key = keySelector(datum, i);
        const extraProps = rendererParams(key, datum, i, data);

        return (
            <Renderer
                key={key}
                className={rendererClassName}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...extraProps}
            />
        );
    };

    if (!hasGroup(props)) {
        return (
            <>
                {data.map(renderListItem)}
            </>
        );
    }

    return (
        <GroupedList
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
        />
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export default typedMemo(List);
