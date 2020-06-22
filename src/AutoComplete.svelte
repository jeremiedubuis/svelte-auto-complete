<script>
    import {libClassName} from './helpers/configuration';
    import AutoCompleteOptions from "./AutoCompleteOptions.svelte";
    import { DIRECTION } from './helpers/constants';

    export let direction = [DIRECTION.LEFT, DIRECTION.BOTTOM];
    export let getOptionText = o => o;
    export let getOptionValue = o => o;
    export let matchingFunction = (value, optionValue) => optionValue.toLowerCase().startsWith(value.toLowerCase());
    export let options;
    export let value = "";
    export let minLength = 0;

    let filteredOptions = [];
    let isToggled = false;
    let input;

    filter();

    const close = e => {
        isToggled = false;
    };

    const onFocus = e => {
        isToggled = true;
    };


    const setValue = _value => {
        value = _value;
        filter();
    };

    function filter() {
        if (value.length < minLength) filteredOptions = [];
        else filteredOptions = options.filter((o) => matchingFunction(value, getOptionValue(o)));
    }

    const onInput = e => {
        setValue(e.target.value);
    };

</script>

<input class="{libClassName}"
       bind:this={input}
       type="text"
       on:focus={onFocus}
       on:input={onInput}
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
