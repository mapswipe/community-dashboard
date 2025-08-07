import SearchSelectInput, { SearchSelectInputProps } from './SearchSelectInput';
import { rankedSearchOnList } from './utils';

type Def = { containerClassName?: string };
type OptionKey = string | number;

export type SelectInputProps<
    T extends OptionKey,
    K extends string,
    O extends object,
    P extends Def,
> = SearchSelectInputProps<T, K, O, P, 'onSearchValueChange' | 'searchOptions' | 'onShowDropdownChange' | 'totalOptionsCount' | 'optionRenderer' | 'optionRendererParams'>;

function SelectInput<T extends OptionKey, K extends string, O extends object, P extends Def>(
    props: SelectInputProps<T, K, O, P>,
) {
    const {
        name,
        options,
        labelSelector,
        nonClearable,
        onChange,
        totalOptionsCount, // eslint-disable-line @typescript-eslint/no-unused-vars
        ...otherProps
    } = props;

    // NOTE: this looks weird but we need to use typeguard to identify between
    // different union types (for onChange and nonClearable)
    if (nonClearable) {
        return (
            <SearchSelectInput
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                onChange={onChange}
                nonClearable={nonClearable}
                name={name}
                options={options}
                labelSelector={labelSelector}
                sortFunction={rankedSearchOnList}
                searchOptions={options}
            />
        );
    }
    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            onChange={onChange}
            nonClearable={nonClearable}
            name={name}
            options={options}
            labelSelector={labelSelector}
            sortFunction={rankedSearchOnList}
            searchOptions={options}
        />
    );
}

export default SelectInput;
