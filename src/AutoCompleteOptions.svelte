<script>
    import { onMount } from 'svelte';
    import { libClassName } from './helpers/configuration';
    import { DIRECTION } from './helpers/constants';
    import onClickOutside from './helpers/onClickOutside';

    export let direction;
    export let filteredOptions;
    export let getOptionText;
    export let input;
    export let setValue;
    export let getOptionValue;
    export let close;

    let options;

    onMount(() => {
        document.body.appendChild(options);
        return onClickOutside(options, close, [libClassName]);
    });

    const onClick = o => {
        setValue(getOptionValue(o));
        close();
    }


    $: getOptionsStyle = () => {
        const rect = input.getBoundingClientRect();
        const left = rect.left + (direction[0] === DIRECTION.RIGHT ? rect.width : 0);
        const top = rect.top + (direction[1] === DIRECTION.TOP ? -options.offsetHeight : rect.height);
        return `position: absolute; left=${left}px; top:${top}px;`
    }
</script>

<div class="{libClassName}-options" bind:this={options} style={getOptionsStyle()}>
    <ul>
        {#each filteredOptions as o}
            <li>
                <button on:click={() => onClick(o)}>
                    <slot name="option" option={o} text={getOptionText(o)}>
                        {getOptionText(o)}
                    </slot>
                </button>
            </li>
        {/each}
    </ul>
</div>
