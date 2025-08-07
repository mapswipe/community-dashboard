import { SearchItemType } from './index';

// eslint-disable-next-line import/prefer-default-export
export function titleSelector(item: SearchItemType) {
    return item.name;
}
