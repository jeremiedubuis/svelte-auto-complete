<script>
    import AutoComplete from '../src/AutoComplete.svelte';
    let v = 'albert';
    let v2 = 'Albert';
</script>

<style>
    :global(button:focus) {
        border: 1px solid;
    }
</style>

<main>
    <AutoComplete bind:value={v} options={['albert', 'bernard']} style="border: 1px solid red;"/>
    <AutoComplete
      bind:value={v2}
      getOptionText={({ label}) => label}
      getOptionValue={({ value }) => value}
      options={[{ label: 'Albert', value: 'albert'}, { label: 'Bernard', value: 'bernard' }]}
      style="border: 1px solid red;" />
</main>
