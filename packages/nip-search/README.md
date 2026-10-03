# @nostrschool/nip-search

Hybrid search over every NIP for the `/nips` page: instant keyword matching, plus search by
meaning with a small sentence model that runs on the visitor's device. The page never calls a
third-party host.

- **Lexical** (instant, synchronous): [MiniSearch](https://lucaong.github.io/minisearch/) over
  title, search hints, summary, section headings, kinds, tags, wire messages and inline-code
  identifiers (`NipMeta.idents`; `max_message_length` also matches as one term). Fuzzy (typos) for words over 4 letters, prefix (as you type) over 2. Stop words are
  dropped and accents folded (`rele` finds "relé"). With `locale: "es"` the index also holds our
  Spanish titles, summaries and Spanish-only hints (`NIP_SEARCH_HINTS_ES`), so the titles the
  cards show are findable. Query shortcuts from `parseNipQuery` (`57`, `nip-5a`, `kind:9735`, `kind 9735`,
  a bare registered kind such as `9735`, `#imeta`) and upper-case wire message types (`CLOSED`, `AUTH`) are pinned on top.
- **Definitions** (`definitions.ts`): a pasted identifier lands on the NIP that *defines* it, not
  on the NIPs that mention it. `supported_nips` appears in seven NIPs, but only NIP-11 lays it out.
  A committed table (`src/data/definitions.json`, ~15 KB) records which NIP defines which term,
  read from the spec's structure: a heading (3), a table row or list item that starts with the
  term, or a term bolded in a definition (2), and a JSON key in an example (1). A NIP that links
  the definer, or builds on NIP-01, is reusing that definition and is dropped. Terms more than 4
  NIPs define are generic and left out. `DEFINITION_OVERRIDES` covers what structure misses
  (`lud16` → 57). A query word typed as an identifier (snake_case, dotted, letters with digits,
  or in quotes/backticks: `supported_nips`, `nostr.json`, `lud16`, `"d"`) pins its strongest
  definer as an exact match, and adds that definer's score in keyword search too. Plain words
  never use the table, because a bolded "relay" in some NIP is emphasis, not a definition.
- **Semantic**: [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
  (quantized ONNX, 23 MB) through `@huggingface/transformers`. The NIPs are cut into ~1,200
  passages (an "about" passage, one per search hint, ~110-word windows of each section) and
  embedded once by `bun run embed:nips`. The vectors are committed as int8 (≈ 470 KB). In the
  browser the same model loads in a Web Worker on the first search or focus, never on page load.
- **Merge**: per NIP, the best passage's similarity (+15% of the second best). Then a weighted sum
  of the two sides, each normalised to its best hit (`fuseScores`, weights lexical 1 :
  semantic 2). Score fusion beat reciprocal rank fusion on the quality sets: see `rank.ts`. A NIP
  found by meaning alone must reach similarity 0.4 (`semanticOnlyMinSimilarity`): gibberish
  scores up to ~0.36, so nonsense returns no results. "nostr"/"nip" are removed from the text the
  model embeds (every passage is about nostr).
- **States**: `$semantic` reports `idle`, `loading` (with `progress`), `ready`, `unavailable`
  (`unsupported`, `save-data`, `offline`, `disabled`) or `error` (`model-failed`,
  `embeddings-failed`). Keyword search always works. `search()` never fails because of the model;
  its only error is `aborted`.

## Usage

```ts
import { listNips } from "@nostrschool/nips/specs";
import { createNipSearch } from "@nostrschool/nip-search";

const search = createNipSearch({
  listings: listNips(),
  locale: "es", // the page locale (default "en"): indexes the Spanish titles the cards show
  // assetHref("models/") etc. A full same-origin URL also works (it is reduced to its path).
  semantic: { modelBaseUrl: "/nostrschool/models/", wasmBaseUrl: "/nostrschool/models/ort/" },
});

search.lexical({ text: "zaps" }).hits.map((h) => h.id); // ["57", …], instant
search.$semantic.subscribe((s) => console.log(s.status, s.progress)); // idle → loading 0.4 → ready
input.addEventListener("focus", () => void search.warmup(), { once: true });

let controller = new AbortController();
input.addEventListener("input", async () => {
  controller.abort();
  controller = new AbortController();
  const result = await search.search(
    { text: input.value, filters: { statuses: ["draft", "final"] }, limit: 20 },
    { signal: controller.signal },
  );
  if (!result.ok) return; // "aborted": a newer keystroke won
  for (const hit of result.value.hits)
    console.log(hit.id, hit.pinned, hit.similarity, hit.snippet?.heading, hit.snippet?.text);
});
```

Lexical-only, without a model (tests, no-JS fallbacks):

```ts
import { createNipSearch } from "@nostrschool/nip-search";
import { listNips } from "@nostrschool/nips/specs";

const search = createNipSearch({ listings: listNips(), semantic: false });
console.log(search.lexical({ text: "kind:9735" }).hits[0]); // { id: "57", pinned: true, … }
```

In Bun (scripts, tests), use the model in-process:

```ts
import { createHybridSearch, createLocalBackend, decodeEmbeddings } from "@nostrschool/nip-search";
import { listNips } from "@nostrschool/nips/specs";

const data = "packages/nip-search/src/data";
const search = createHybridSearch({
  listings: listNips(),
  semantic: createLocalBackend({
    embedder: { localModelPath: "apps/site/public/models/" },
    loadIndex: async () =>
      decodeEmbeddings(
        await Bun.file(`${data}/embeddings.json`).json(),
        await Bun.file(`${data}/embeddings.bin`).arrayBuffer(),
      ),
  }),
});
const result = await search.search({ text: "send sats to a post" });
if (result.ok) console.log(result.value.mode, result.value.hits[0]?.id); // "hybrid" "57"
```

## Rebuilding the embeddings

```sh
bun run embed:nips              # fetch missing model files (pinned revision + SHA-256), copy ort wasm, embed (~20 s)
bun run embed:nips -- --assets  # only the model files and the ort wasm
bun run embed:nips -- --check   # exit 1 if model, wasm or embeddings are stale (CI)
```

Re-run it after `bun run snapshot:nips`, after editing a NIP's English `summary`
(`packages/i18n/src/locales/en/nips/rN.ts`), or after editing `src/aliases.ts`. `bun test` checks
that the passages match the corpus. `--check` also catches edited summaries and hints, through
`textHash`.

## Rebuilding the definitions table

```sh
bun run --cwd packages/nip-search definitions   # rewrite src/data/definitions.json from the corpus
```

Re-run it after `bun run snapshot:nips` or after editing `DEFINITION_OVERRIDES`. `bun test`
fails while the committed file differs from the corpus.

```ts
import { identifierTerms, NIP_DEFINITIONS, primaryDefiners } from "@nostrschool/nip-search";

console.log(identifierTerms('the relays field of nostr.json, "d"')); // ["nostr.json", "d"]
console.log(primaryDefiners(NIP_DEFINITIONS, "supported_nips")); // ["11"]
```

## Quality

`src/quality.test.ts` runs 70 natural-language queries through the real model and the committed
vectors, and checks the top 3 results:

- 22 core queries must all hit, for example "send sats to a post" → 57, "private DMs" → 17,
  "login with extension" → 07, "relay information" → 11, "delete my note" → 09,
  "long articles" → 23 and "verify my domain name" → 05.
- The other 18 tuned queries must stay at or above 95%.
- 30 held-out queries must stay at or above 85% (they hit 28/30 when written).
- 14 Spanish queries must stay at or above 90%, and gibberish must return nothing.
- 10 identifier queries must put the defining NIP **first**: `supported_nips`,
  `max_message_length`, `auth_required` and `payments_url` → 11, `lud16` and `lud06` → 57,
  "relays field of nostr.json" and `nostr.json` → 05, `"d" tag addressable` and `created_at` → 01.

## Files

| Path | What |
|---|---|
| `src/types.ts` | Public types |
| `src/browser.ts` | `createNipSearch` (Web Worker backend, capability checks) |
| `src/search.ts` | `createHybridSearch` (any backend) |
| `src/lexical.ts`, `src/aliases.ts` | MiniSearch index, stop words, search hints |
| `src/definitions.ts` | Which NIP defines which identifier: extraction, table, lookups (pure) |
| `src/data/definitions.json` | Committed definitions table (`bun run definitions`, `src/write-definitions.ts`) |
| `src/rank.ts` | `aggregateByNip`, `fuseScores`, `pinnedIds`, `rankResults` (pure) |
| `src/vectors.ts` | `quantizeInt8`, `decodeEmbeddings`, `cosineTopK` (pure) |
| `src/chunk.ts` | Corpus → passages (pure) |
| `src/embedder.ts`, `src/backend.ts` | transformers.js loader (local files only), in-process backend |
| `src/worker.ts`, `src/worker-protocol.ts`, `src/worker-backend.ts` | Web Worker entry, messages, page side |
| `src/build.ts` | Build-time only: passages to embed, staleness check (imports the full corpus) |
| `src/data/embeddings.{json,bin}` | Committed passage metadata + int8 vectors |
| `../../scripts/embed-nips.ts` | `bun run embed:nips` |
| `../../apps/site/public/models/` | Self-hosted model (`Xenova/all-MiniLM-L6-v2/…`) + `ort/ort-wasm-simd-threaded.{mjs,wasm}` |
