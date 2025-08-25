import {
    useCallback,
    useState,
} from 'react';
import { useNavigate } from 'react-router';
import {
    isDefined,
    mapToList,
} from '@togglecorp/fujs';

function useUrlState<T>(
    inTransformer: (
        params: Record<string, string>,
    ) => T,
    outTransformer: (
        value: T,
    ) => Record<string, string | undefined | null>,
) {
    const navigate = useNavigate();

    const [state, setState] = useState(() => {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlSearchParams.entries());
        return inTransformer(params);
    });

    const setStateSafe = useCallback(
        (value: T) => {
            setState(value);

            const paramsFromState = outTransformer(value);

            const urlSearchParams = new URLSearchParams(window.location.search);
            const params = Object.fromEntries(urlSearchParams.entries());

            const newParams = mapToList(
                {
                    ...params,
                    ...paramsFromState,
                },
                (val, key) => (isDefined(val) ? [key, val] : undefined),
            ).filter(isDefined);

            navigate(
                { search: new URLSearchParams(newParams).toString() },
                { replace: true },
            );
        },
        [navigate, outTransformer],
    );

    return [state, setStateSafe] as const;
}

export default useUrlState;
