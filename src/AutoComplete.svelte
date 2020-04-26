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

    let filteredOptions;
    let isToggled = false;
    let input;

    const onBlur = e => {
        isToggled = false;
    };

    const onFocus = e => {
        isToggled = true;
    };

    const onInput = e => {
        value = e.target.value;
        filteredOptions = options.filter((o) => matchingFunction(value, getOptionValue(o)));
    };

</script>

<input class="{libClassName}"
       bind:this={input}
       type="text"
       on:blur={onBlur}
       on:focus={onFocus}
       on:input={onInput}
       bind:value/>

{#if isToggled}
    {#if filteredOptions.length}
    <AutoCompleteOptions bind:filteredOptions bind:getOptionText bind:input bind:direction>
        <slot name="option" />
    </AutoCompleteOptions>
    {:else}
        <slot name="noResults" value={value} />
    {/if}
{/if}