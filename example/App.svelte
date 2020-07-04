<script>
    import AutoComplete from '../src/AutoComplete.svelte';
</script>

<style>
    :global(button:focus) {
        border: 1px solid;
    }
</style>

<main>
    <AutoComplete options={['albert', 'bernard']} style="border: 1px solid red;"/>
</main>
