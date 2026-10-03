# @nostrschool/nip-editor

A spec-driven editor and explainer for every NIP. Give it a `NipSpec` and a locale and it
renders:

- a **typed form** for the spec's part: kind picker, created_at with a date readout, content by
  format (text, JSON, encrypted with demo keys), tag rows you can add from a template, reorder,
  extend and remove, and persona / demo-event / relay pickers for pubkeys, ids and relay URLs;
- a **live JSON view** (CodeMirror 6, JSON language, lint underlines from `validateAgainstSpec`)
  kept in sync with the form both ways. JSON that does not parse pauses the form instead of
  losing your edit;
- an **explain panel**: focus a form field or put the caret on any JSON node to see what the
  spec says about it, its type, allowed values and any problems;
- example presets, a validity stamp, **sign with demo key** (real id and Schnorr signature via
  `@nostrschool/protocol`, deterministic so shared links reproduce), a shareable `#edit=…` link;
- a **how-it-works walkthrough** whose steps jump to the part and field they talk about, flows
  between parts (zap request → zap receipt), and the variant renderers: relay messages, JSON
  documents, encodings (both directions, with a colour-coded breakdown and TLV table), HTTP
  requests (with a live NIP-98 auth header) and behaviour-only NIPs (sequence diagram).

On phones the form, JSON and explanation are tabs (Form | JSON | Explain) with a sticky "explain
this" slip; from `md` (768px) up they sit side by side. Everything is keyboard reachable (arrow
keys move between tabs; Escape then Tab leaves the JSON editor).

Demo keys only: signing and encryption use the public fixture personas. The editor never asks
for a real secret key.

## Usage (Astro page)

```astro
---
import { NipEditor } from "@nostrschool/nip-editor";
import { getSpec } from "@nostrschool/nips/specs";
const spec = getSpec("57");
---
{spec && <NipEditor client:idle testid="nip-editor" locale="en" spec={spec} />}
```

Props: `testid`, `locale`, `spec`, optional `part` / `example` (initial selection, overridden by
the URL hash), `syncHash` (default `true`), `layout` (`"auto" | "tabs" | "split"`) and
`onchange(state)`.

## Pure helpers

Everything the components do is available as plain functions, so other islands and tests can
use it without a DOM:

```ts
import {
  decodeEditorHash,
  encodeEditorHash,
  explainAt,
  initialValue,
  issueDiagnostics,
  issueMessage,
  checkText,
  livePath,
} from "@nostrschool/nip-editor";
import { findSpecPart } from "@nostrschool/nips";
import { getSpec } from "@nostrschool/nips/specs";

const spec = getSpec("25");
const part = spec && findSpecPart(spec, { kind: "event", id: "reaction" });
if (spec && part) {
  const value = initialValue(part); // the first example, as an unsigned event
  const text = JSON.stringify(value, null, 2);
  const { report } = checkText(spec, part, text); // parse + validate
  const lint = issueDiagnostics(text, report.issues, issueMessage("en")); // CodeMirror ranges
  const why = explainAt(part, value, ["tags", 0, 1], report.issues); // what is tags[0][1]?
  const hash = encodeEditorHash({ part: { kind: "event", id: part.part.id }, value });
  console.log(lint.length, why.breadcrumb, decodeEditorHash(hash, spec).ok);
}

// NIP-09: "needs an e or a tag" (requireOneOf) is explained on the tag list and on e/a rows.
const deletion = getSpec("09");
const del = deletion && findSpecPart(deletion, { kind: "event", id: "deletion" });
if (del) {
  const value = initialValue(del);
  console.log(explainAt(del, value, ["tags"], []).rules); // [{ explain, tags: ["e","a"], present: [...] }]
  // A selection on a row that was removed is cut back to what still exists: ["tags"].
  console.log(livePath({ tags: [] }, ["tags", 3, 1]));
}
```

```ts
import { encodeInputs, signDraft, eventFromTemplate } from "@nostrschool/nip-editor";

// Sign any draft with a persona's demo key (same draft → same signature).
const signed = signDraft(eventFromTemplate({ kind: 1, tags: [], content: "hi" }, "alice"), "alice");
console.log(signed.ok && signed.value["sig"]);
```

## Encoding inputs: naming conventions

Encoding parts are matched to codec arguments by **field type first, then name**:

| Codec | Inputs it reads |
|---|---|
| `npub`, `nprofile`, `nevent`, `naddr` | `pubkey` type (or a name like `pubkey`/`author`), `event-id`, every `relay-url` input, `kind`, a `text` input named `identifier`/`d` |
| `nsec` | a secret input (`bech32` with `nsec`, or a name containing `sec`/`priv`/`secret`) |
| `nostr-uri` | a `bech32` entity input, else the pointer fields above |
| `ncryptsec` | secret input, `password`, `log_n`/`log-n`, `key-security`/`ksb` (log_n above 16 is explained, not run) |
| `mnemonic` | `mnemonic`/`words`/`seed`, optional `passphrase`, `account`/`index` |
| `nip44-payload`, `nip04-payload` | `plaintext`/`message`/`text`, sender (secret input, or a `pubkey` named `sender`/`from`), `recipient`, optional `nonce`/`iv` |

Secret inputs render as a persona picker only.

## Tests

`bun test` (unit + component tests on happy-dom with the real CodeMirror, no mocks), including
`real-specs.test.ts`, which opens every finished spec in `@nostrschool/nips` in the editor and
checks each example is valid and every encoding example encodes.
