import {
    ApolloClientOptions,
    ApolloLink as ApolloLinkFromClient,
    HttpLink,
    InMemoryCache,
    NormalizedCacheObject,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

function getCookie(): string | null {
    const match = document.cookie.match(/(?:^|;\s*)(mapswipe[^=]*csrftoken)=([^;]+)/i);
    return match ? decodeURIComponent(match[2]) : null;
}

const GRAPHQL_ENDPOINT = import.meta.env.APP_GRAPHQL_ENDPOINT as string;

const csrfMiddleware = setContext((_, { headers }) => {
    const csrfToken = getCookie();
    return {
        headers: {
            ...headers,
            'X-CSRFToken': csrfToken ?? '',
        },
    };
});

const link = csrfMiddleware.concat(
    new HttpLink({
        uri: GRAPHQL_ENDPOINT,
        credentials: 'include',
    }) as unknown as ApolloLinkFromClient,
) as ApolloLinkFromClient;

/*
const link: ApolloLinkFromClient = ApolloLink.from([
    new RetryLink(),
    ApolloLink.split(
        (operation) => operation.getContext().hasUpload,
        createUploadLink({
            uri: GRAPHQL_ENDPOINT,
            credentials: 'include',
        }) as unknown as ApolloLink,
        ApolloLink.from([
            new RestLink({
                uri: 'https://osmnames.idmcdb.org',
            }) as unknown as ApolloLink,
            new BatchHttpLink({
                uri: GRAPHQL_ENDPOINT,
                credentials: 'include',
            }),
        ]),
    ),
]) as unknown as ApolloLinkFromClient;
*/

const apolloOptions: ApolloClientOptions<NormalizedCacheObject> = {
    link,
    cache: new InMemoryCache({
        typePolicies: {
            // NOTE: Singleton types that have no identifying field can use an empty
            // array for their keyFields.
            FilteredStats: {
                keyFields: [],
            },
        },
    }),
    assumeImmutableResults: true,
    defaultOptions: {
        query: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
        },
        watchQuery: {
            // NOTE: setting nextFetchPolicy to cache-and-network is risky
            fetchPolicy: 'network-only',
            nextFetchPolicy: 'cache-only',
            errorPolicy: 'all',
        },
    },
};

export default apolloOptions;
