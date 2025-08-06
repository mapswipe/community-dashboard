import {
    Action,
    BrowserHistory,
    createBrowserHistory,
    Location,
    Update,
} from 'history';

const originalHistory = createBrowserHistory();

const patchedHistory: BrowserHistory & {
    sentryListen: (cb: (location: Location, action: Action) => void) => () => void;
} = {
    ...originalHistory,
    sentryListen(cb: (location: Location, action: Action) => void) {
        return originalHistory.listen(({ location, action }: Update) => {
            cb(location, action);
        });
    },
};

export default patchedHistory;
