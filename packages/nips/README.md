# @nostrschool/nips

Everything the NIP reference knows about NIPs:

- a **corpus snapshot** of [nostr-protocol/nips](https://github.com/nostr-protocol/nips) at a
  pinned commit (titles, statuses, kinds, message types from the README table and from NIP
  bodies, tags, inline-code identifiers, cross-references, markdown split into sections),
- the **`NipSpec` schema** and one hand-written spec per NIP (`src/specs/nip-<id>.ts`) that
  drives the editor, the JSON lint and the explainers,
- **`validateAgainstSpec()`** (issue codes with JSON paths, messages in `@nostrschool/i18n`),
- pure **browse helpers**: filters, sorting, facet counts, query shortcuts, rank fusion,
- a sanitizing **markdown renderer** for the specification text.

## Entry points

| Import | What | Where |
|---|---|---|
| `@nostrschool/nips` | types, `NIP_INDEX` (metadata only), helpers, validator | anywhere, incl. islands |
| `@nostrschool/nips/specs` | `NIP_SPECS`, `getSpec`, `listNips` | build time; pass one spec to an island |
| `@nostrschool/nips/corpus` | `NIP_CORPUS` (full markdown, ~1.4 MB), `renderNipMarkdown` | build time only |

## Usage

```ts
import {
  filterNips,
  getNipMeta,
  kindRegistryRows,
  NIP_INDEX,
  parseNipQuery,
  sortNips,
} from "@nostrschool/nips";
import { listNips } from "@nostrschool/nips/specs";

console.log(NIP_INDEX.source.commit.length); // → 40
console.log(getNipMeta("57")?.title); // → Lightning Zaps
console.log(filterNips(listNips(), { kind: 9735 }).map((n) => n.id).join()); // → 57
console.log(sortNips(listNips(), "id").slice(57, 60).map((n) => n.id).join()); // → 59,5A,60
console.log(JSON.stringify(parseNipQuery("zaps kind:9735 #bolt11"))); // → {"text":"zaps","ids":[],"kinds":[9735],"tags":["bolt11"]}
// A bare registered kind is pinned too when you say which kinds exist (a year stays plain text):
const isKnownKind = (k: number) => kindRegistryRows(k).length > 0;
console.log(parseNipQuery("9735 2024", new Set(), isKnownKind).kinds.join()); // → 9735
console.log(getNipMeta("11")?.idents.includes("max_message_length")); // → true
```

Rendering a NIP's specification (build time):

```ts
import { getNipDocument, NIP_CORPUS, renderNipMarkdown } from "@nostrschool/nips/corpus";

const doc = getNipDocument("17");
const html = renderNipMarkdown(doc?.markdown ?? "", {
  nipHref: (id, hash) => `/en/nips/${id}/${hash}`,
  sourceBase: `${NIP_CORPUS.source.repo}/blob/${NIP_CORPUS.source.commit}/`,
});
console.log(html.includes('href="/en/nips/44/"')); // → true
```

## Validating and building values

`validateAgainstSpec` checks a value (event, message, document, HTTP request or encoding inputs)
against one spec part and never throws: every problem is a typed issue with a JSON path the editor
maps to a range, `params` for the localized message (`getDictionary(locale).nips.issues[code]`) and,
where the spec has one, the `explain` key of the field. Events are NIP-01 checked too (id recomputed,
Schnorr signature verified); a template without id/sig is valid with an `unsigned` info.

```ts
import {
  defaultEventTemplate,
  type EventShape,
  validateAgainstSpec,
  validateField,
} from "@nostrschool/nips";

const reaction: EventShape = {
  id: "reaction",
  label: "reaction.label",
  explain: "reaction",
  kinds: [7],
  content: { format: "text", explain: "content", required: true },
  tags: [
    {
      name: "e",
      explain: "tag.e",
      presence: "required",
      repeatable: true,
      fields: [{ name: "id", type: { type: "event-id" }, explain: "tag.e.id" }],
    },
  ],
  examples: [],
};

const template = defaultEventTemplate(reaction, { createdAt: 1735689600 });
console.log(JSON.stringify(template)); // → {"kind":7,"created_at":1735689600,"tags":[["e",""]],"content":""}

const report = validateAgainstSpec(template, { kind: "event", part: reaction });
console.log(report.valid, report.issues.map((i) => `${i.code}@${i.path.join(".")}`).join(" ")); // → false unsigned@ missing-field@tags.0.1 content-required@content
console.log(report.issues[1]?.explain); // → tag.e.id

// Per-keystroke checks for one form input:
console.log(validateField("wss://relay.example", { type: "relay-url" }).length); // → 0
console.log(validateField("1735689600000", { type: "timestamp" })[0]?.code); // → invalid-timestamp
```

Alternatives that per-tag `presence` cannot express go in `requireOneOf`: a NIP-09 deletion needs
an `e` **or** an `a` tag, so the shape says `requireOneOf: [{ tags: ["e", "a"], explain: "rule.target" }]`
and a request with neither gets a `missing-one-of` error (`params.tags` = `"e, a"`) at path `["tags"]`.

Paths may continue into JSON-encoded strings (`["content", "name"]` for kind 0 metadata,
`["tags", 4, 1, "kind"]` inside a zap receipt's embedded request); map them to the longest prefix
that exists in the JSON text. `validateJsonText(text, target)` parses first and reports
`invalid-json` on a parse failure. Other helpers: `defaultPartValue`, `defaultMessage`,
`defaultDocument`, `defaultHttpRequest`, `defaultEncodingInputs`, `tagTemplate`, `matchTagSpec`,
and for browsing `nipsForKind`, `nipsWithStatus`, `getNipRelations` and the `dependsOn` filter.

## Writing a spec

A spec is plain JSON-serialisable data (it becomes an island prop and URL state) with no
user-visible prose: every explanation is a `TextKey` into the NIP's strings in
`packages/i18n/src/locales/<locale>/nips/rN.ts` (`n<id>.text`). See CONTRACTS.md "NIP reference"
for the full schema and the range/ownership table. `bun test packages/nips` checks that every
corpus id has a spec, that each finished spec fills its variant and walkthrough, that every
TextKey has English text (and no text is unused), and that every reference resolves.

## Refreshing the snapshot

```bash
bun run snapshot:nips                       # latest commit
bun run snapshot:nips -- --commit <sha>     # pin
NIPS_REPO=/path/to/clone bun run snapshot:nips   # offline
```

New NIP ids then fail `specs.test.ts` until they get a spec file, an entry in `src/specs/index.ts`
and strings in their range file.
