<script>
    import { onMount } from 'svelte';
    import { libClassName } from './helpers/configuration';
    import { DIRECTION } from './helpers/constants';

    export let direction;
    export let filteredOptions;
    export let getOptionText;
    export let input;

    let options;

    onMount(() => {
        document.body.appendChild(options);
        return () => document.body.removeChild(options);
    });


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
                <slot name="option" option={o} text={getOptionText(o)}>
                    {getOptionText(o)}
                </slot>
            </li>
        {/each}
    </ul>
</div>