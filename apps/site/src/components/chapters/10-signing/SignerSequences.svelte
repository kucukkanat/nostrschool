<script lang="ts">
  import { SequenceDiagram } from "@nostrschool/diagrams";
  import { FIXTURE_NOW } from "@nostrschool/fixtures";
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { emit, JsonView, Tabs } from "@nostrschool/ui";
  import { demoKeys, makeTemplate } from "./playground.ts";
  import {
    NIP07_LANES,
    NIP46_LANES,
    nip07Sequence,
    nip46Sequence,
    toLanes,
    toMessages,
  } from "./sequences.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch10);

  const FLOWS = ["nip07", "nip46"] as const;
  let selected: string = $state("nip07");

  // Real crypto, computed once: the payloads in the detail panel are genuine signed/encrypted events.
  const keys = demoKeys();
  const template = makeTemplate("gm nostr!", FIXTURE_NOW);
  const seq07 = keys.ok ? nip07Sequence(keys.value, template) : keys;
  const seq46 = keys.ok ? nip46Sequence(keys.value, template) : keys;

  const flows = $derived({
    nip07: {
      copy: t.sequences.nip07,
      lanes: toLanes(NIP07_LANES, t.sequences.nip07.lanes),
      result: seq07.ok
        ? { ok: true as const, messages: toMessages(seq07.value, t.sequences.nip07.messages) }
        : seq07,
    },
    nip46: {
      copy: t.sequences.nip46,
      lanes: toLanes(NIP46_LANES, t.sequences.nip46.lanes),
      result: seq46.ok
        ? { ok: true as const, messages: toMessages(seq46.value, t.sequences.nip46.messages) }
        : seq46,
    },
  });

  // Reaching the final hop means a note got signed without the key leaving the signer.
  const onstep = (step: number, total: number): void => {
    if (step === total - 1) emit("signature:valid", {});
  };
</script>

<section class="sequences" data-testid="ch10-sequences">
  <Tabs
    testid="ch10-seq-tabs"
    tabs={FLOWS.map((id) => ({ id, label: t.sequences.tabs[id] }))}
    bind:selected
    label={t.sequences.tabsLabel}
  >
    {#snippet panel(
      id,
    )}
      {@const flow = id === "nip46" ? "nip46" : "nip07"}
      {@const data = flows[flow]}
      {#if data.result.ok}
        {@const messages = data.result.messages}
        <SequenceDiagram
          testid="ch10-seq-{flow}"
          {locale}
          title={data.copy.title}
          description={data.copy.description}
          lanes={data.lanes}
          {messages}
          onstep={(s) => onstep(s, messages.length)}
        >
          {#snippet detail(
            msg,
          )}
            <div class="detail" data-testid="ch10-seq-{flow}-payload">
              <JsonView
                testid="ch10-seq-{flow}-json-{msg.id}"
                {locale}
                value={msg.payload}
                collapsedDepth={2}
              />
            </div>
          {/snippet}
        </SequenceDiagram>
      {:else}
        <p role="alert" data-testid="ch10-seq-{flow}-error">
          {format(t.playground.error, { message: data.result.error.message })}
        </p>
      {/if}
    {/snippet}
  </Tabs>
</section>

<style>
  .sequences {
    margin: var(--space-xl) 0;
    min-height: var(--size-diagram-min-height);
  }
  .detail {
    max-height: calc(var(--size-diagram-min-height) / 1.5);
    overflow: auto;
  }
</style>
