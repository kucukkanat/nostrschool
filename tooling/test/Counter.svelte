<script lang="ts">
  interface Props {
    readonly start?: number;
  }
  const { start = 0 }: Props = $props();
  let count = $state(start);
  const double = $derived(count * 2);
</script>

<button type="button" data-testid="counter" onclick={() => (count += 1)}>{count}:{double}</button>
