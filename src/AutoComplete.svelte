<script>
    import { onMount } from 'svelte';
    import {libClassName} from './helpers/configuration';
    import AutoCompleteOptions from "./AutoCompleteOptions.svelte";
    import { DIRECTION } from './helpers/constants';
    $: ({
        direction = [DIRECTION.LEFT, DIRECTION.BOTTOM],
        getOptionText = o => o,
        getOptionValue = o => o,
        matchingFunction = (value, optionValue) => optionValue.toLowerCase().startsWith(value.toLowerCase()),
        options,
        value: providedValue,
        minLength = 0,
        onBlur,
        onFocus,
        onInput,
        ...nativeProps
    } = $$props);

    export let value = '';

    let filteredOptions = [];
    let isToggled = false;
    let input;

    const close = e => {
        isToggled = false;
    };

    const _onFocus = e => {
        isToggled = true;
        if (typeof onFocus === 'function') onFocus(e);
    };

    const _onBlur = e => {
        if (typeof onBlur === 'function') onBlur(e);
    };


    const setValue = _value => {
        value = _value;
        filter();
    };

    function filter() {
        if (value.length < minLength) filteredOptions = [];
        else filteredOptions = options.filter((o) => matchingFunction(value, getOptionText(o)) && value !== getOptionValue(o));
    }

    const _onInput = e => {
        setValue(e.target.value);
        if (typeof onInput === 'function') onInput(e);
    };

    onMount(() => filter());

</script>

<input class="{libClassName}"
       bind:this={input}
       type="text"
       on:focus={_onFocus}
       on:input={_onInput}
       on:blur={_onBlur}
        {...nativeProps}
       bind:value/>

{#if isToggled}
    {#if filteredOptions.length}
    <AutoCompleteOptions bind:filteredOptions bind:getOptionText bind:input bind:direction setValue={setValue} getOptionValue={getOptionValue} close={close}>
        <slot name="option" />
    </AutoCompleteOptions>
    {:else}
        <slot name="noResults" value={value} />
    {/if}
{/if}
