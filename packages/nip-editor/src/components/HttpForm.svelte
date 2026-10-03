<script lang="ts">
  import { format } from "@nostrschool/i18n";
  import type { JsonPath, JsonValue } from "@nostrschool/nips";
  import { isJsonObject } from "../logic/event.ts";
  import { DEFAULT_SIGNER } from "../logic/fields.ts";
  import { authHeaderName, base64ToUtf8, buildAuthEvent } from "../logic/http.ts";
  import { setIn } from "../logic/immutable.ts";
  import { editorStrings, hasNipText, nipText } from "../logic/text.ts";
  import { issueMessage } from "../logic/validate.ts";
  import type { HttpFormProps } from "../types.ts";
  import FieldInput from "./FieldInput.svelte";
  import SchemaField from "./SchemaField.svelte";

  let {
    testid,
    locale,
    nip,
    part,
    value = $bindable(),
    issues,
    onselectpath,
    authEvent,
    signer = DEFAULT_SIGNER,
  }: HttpFormProps = $props();
  const t = $derived(editorStrings(locale));
  const text = $derived(nipText(locale, nip));
  const message = $derived(issueMessage(locale));
  const req = $derived(isJsonObject(value) ? value : {});
  const headers = $derived<{ readonly [k: string]: string }>(
    isJsonObject(req["headers"])
      ? Object.fromEntries(
          Object.entries(req["headers"]).map(([k, v]) => [
            k,
            typeof v === "string" ? v : JSON.stringify(v),
          ]),
        )
      : {},
  );
  const specNames = $derived(part.headers.map((h) => h.name.toLowerCase()));
  const extra = $derived(Object.keys(headers).filter((k) => !specNames.includes(k.toLowerCase())));
  const headerEntry = (name: string) =>
    Object.entries(headers).find(([k]) => k.toLowerCase() === name.toLowerCase());
  const change = (path: JsonPath, v: JsonValue) => {
    value = setIn(req, path, v);
  };
  const setHeader = (name: string, v: string) => {
    const key = headerEntry(name)?.[0] ?? name;
    value = { ...req, headers: { ...headers, [key]: v } };
  };
  const issuesAt = (path: JsonPath) =>
    issues.filter(
      (i) =>
        i.severity !== "info" &&
        i.path.length === path.length &&
        i.path.every((p, k) => p === path[k]),
    );
  const select = (path: JsonPath) => (e: FocusEvent) => {
    e.stopPropagation();
    onselectpath?.(path);
  };

  const authName = $derived(authHeaderName(part));
  let authError = $state("");
  const buildAuth = () => {
    if (authEvent === undefined) return;
    const r = buildAuthEvent(part, authEvent, value, signer);
    authError = r.ok ? "" : format(t.signFailed, { reason: r.error.message });
    if (r.ok) setHeader(authName, r.value.header);
  };
  /** The event inside a "Nostr <base64>" header, pretty-printed, so the encoding is visible. */
  const decodedAuth = $derived.by(() => {
    const raw = headerEntry(authName)?.[1];
    const b64 = raw?.replace(/^Nostr\s+/, "");
    const json = b64 === undefined || b64 === "" ? undefined : base64ToUtf8(b64);
    if (json === undefined) return undefined;
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch (e) {
      // Base64 that isn't JSON: show nothing (the validator reports the header itself).
      if (e instanceof SyntaxError) return undefined;
      throw e;
    }
  });
</script>

<div class="form" data-testid={testid}>
  <div class="line" onfocusin={select(["url"])} data-json-path={JSON.stringify(["url"])}>
    <span class="method" data-testid="{testid}-method">{part.method}</span>
    <div class="url">
      <FieldInput
        testid="{testid}-url"
        {locale}
        field={{ type: "url" }}
        label={t.http.url}
        value={typeof req["url"] === "string" ? req["url"] : ""}
        placeholder={part.urlTemplate}
        invalid={issuesAt(["url"]).length > 0}
        onchange={(v) => change(["url"], v)}
      />
    </div>
  </div>
  {#if hasNipText(nip, part.explain)}
    <p class="help">{text(part.explain)}</p>
  {/if}

  <section class="block">
    <h4 class="block-title">{t.http.headers}</h4>
    {#each part.headers as h (h.name)}
      <div
        class="header"
        data-testid="{testid}-header-{h.name}"
        onfocusin={select(["headers", headerEntry(h.name)?.[0] ?? h.name])}
        data-json-path={JSON.stringify(["headers", headerEntry(h.name)?.[0] ?? h.name])}
      >
        <FieldInput
          testid="{testid}-header-{h.name}-field"
          {locale}
          field={h.value}
          label="{h.name}{h.required ? " *" : ""}"
          value={headerEntry(h.name)?.[1] ?? ""}
          invalid={issuesAt(["headers", headerEntry(h.name)?.[0] ?? h.name]).length > 0}
          onchange={(v) => setHeader(h.name, v)}
        />
        {#if hasNipText(nip, h.explain)}
          <p class="help">{text(h.explain)}</p>
        {/if}
        {#each issuesAt(["headers", headerEntry(h.name)?.[0] ?? h.name]) as issue, i (i)}
          <p class="bad">{message(issue)}</p>
        {/each}
      </div>
    {/each}
    {#each extra as name (name)}
      <div
        class="header"
        data-testid="{testid}-header-{name}"
        onfocusin={select(["headers", name])}
        data-json-path={JSON.stringify(["headers", name])}
      >
        <FieldInput
          testid="{testid}-header-{name}-field"
          {locale}
          field={{ type: "text" }}
          label={name}
          value={headers[name] ?? ""}
          onchange={(v) => setHeader(name, v)}
        />
      </div>
    {/each}
    {#if authEvent !== undefined}
      <div class="auth" data-testid="{testid}-auth">
        <button type="button" class="act" data-testid="{testid}-auth-build" onclick={buildAuth}>
          {t.http.buildAuth}
        </button>
        {#if authError !== ""}
          <p class="bad" role="alert">{authError}</p>
        {/if}
        {#if decodedAuth !== undefined}
          <p class="help">{t.http.authEvent}</p>
          <pre class="decoded" data-testid="{testid}-auth-event">{decodedAuth}</pre>
        {/if}
      </div>
    {/if}
  </section>

  {#if part.body !== undefined}
    <section class="block" data-testid="{testid}-body">
      <h4 class="block-title">{t.http.body} <code class="mt">{part.body.mediaType}</code></h4>
      <SchemaField
        testid="{testid}-body"
        {locale}
        {nip}
        schema={part.body.schema}
        value={req["body"]}
        path={["body"]}
        label="body"
        {issues}
        onchange={change}
        {onselectpath}
      />
    </section>
  {/if}

  {#if part.responses.length > 0}
    <section class="block">
      <h4 class="block-title">{t.http.responses}</h4>
      <ul class="responses">
        {#each part.responses as r (r.status)}
          <li>
            <code class="status" data-ok={r.status < 400}>{r.status}</code>
            {hasNipText(nip, r.explain) ? text(r.explain) : ""}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .form {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  .line {
    display: flex;
    align-items: end;
    gap: var(--space-sm);
  }
  .url {
    flex: 1;
    min-inline-size: 0;
  }
  .method {
    display: inline-grid;
    place-items: center;
    min-block-size: var(--size-touch-target);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-secondary);
    color: var(--color-on-secondary);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    box-shadow: var(--shadow-pop-sm);
  }
  .block {
    display: grid;
    gap: var(--space-sm);
    padding-block-start: var(--space-sm);
    border-block-start: var(--border-width-medium) solid var(--color-border-strong);
  }
  .block-title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .mt {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-regular);
    color: var(--color-text-muted);
  }
  .header {
    display: grid;
    gap: var(--space-3xs);
  }
  .help {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .auth {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-sm);
    border: var(--border-width-thin) dashed var(--color-border-strong);
    border-radius: var(--radius-sm);
    background-image: var(--pattern-halftone);
  }
  .act {
    justify-self: start;
    min-block-size: var(--size-touch-target);
    padding: 0 var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
    transition:
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
  }
  .act:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  .act:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .decoded {
    margin: 0;
    padding: var(--space-sm);
    /* Wrap the 64-char hex values instead of scrolling: a horizontal scroller here could not be
       reached by keyboard (WCAG 2.1.1) and hides most of the id/sig on phones anyway. */
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    border-radius: var(--radius-sm);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .responses {
    display: grid;
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--font-size-sm);
  }
  .status {
    padding: 0 var(--space-2xs);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-danger-subtle);
    font-family: var(--font-family-mono);
  }
  .status[data-ok="true"] {
    background: var(--color-success-subtle);
  }
  .bad {
    margin: 0;
    color: var(--color-danger);
    font-size: var(--font-size-xs);
  }
</style>
