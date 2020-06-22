<script>
    import { onMount } from 'svelte';
    import { libClassName } from './helpers/configuration';
    import { DIRECTION } from './helpers/constants';
    import onClickOutside from './helpers/onClickOutside';
    import onKeyDown from './helpers/onKeyDown';

    export let direction;
    export let filteredOptions;
    export let getOptionText;
    export let input;
    export let setValue;
    export let getOptionValue;
    export let close;

    let options;
    let focused = 0;

    const focus = i => focused = Math.min(Math.max(i,0),filteredOptions.length-1);

    const onArrowUp = () => focus(focused-1);
    const onArrowDown = () => focus(focused+1);
    const onEnter = () => setValue(getOptionText(filteredOptions[focused]))

    onMount(() => {
        if (typeof document !== 'undefined') document.body.appendChild(options);
        const removeListeners = [onClickOutside(options, close, [libClassName])];
        removeListeners.push(onKeyDown('ArrowUp', onArrowUp));
        removeListeners.push(onKeyDown('ArrowDown', onArrowDown));
        removeListeners.push(onKeyDown('Enter', onEnter));


        return () => removeListeners.forEach(rm => rm());
    });

    const onClick = o => {
        setValue(getOptionValue(o));
        close();
    }


    $: getOptionsStyle = () => {
        const rect = input.getBoundingClientRect();
        const left = rect.left + (direction[0] === DIRECTION.RIGHT ? rect.width : 0);
        const top = rect.top + (direction[1] === DIRECTION.TOP ? -options.offsetHeight : rect.height);
        return `position: absolute; left:${left}px; top:${top}px;`
    }
</script>

<div class="{libClassName}-options" bind:this={options} style={getOptionsStyle()}>
    <ul>
        {#each filteredOptions as o, i}
            <li>
                <button on:click={() => onClick(o)} class:is-focused={focused === i}>
                    <slot name="option" option={o} text={getOptionText(o)}>
                        {getOptionText(o)}
                    </slot>
                </button>
            </li>
        {/each}
    </ul>
</div>
