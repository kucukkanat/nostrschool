// Owner: spec author r6 (NIPs letter ids). NIP-C0: Code Snippets (kind 1337).
// Explanations: packages/i18n/src/locales/en/nips/r6.ts → nC0.text.
import type { NipSpec, TagSpec } from "../spec.ts";
import { BETA, BOB, RELAY_HINT, textTag } from "./r6-common.ts";

const snippet = { kind: "event", id: "snippet" } as const;

const tags: readonly TagSpec[] = [
  {
    name: "l",
    explain: "tag.l",
    presence: "recommended",
    repeatable: false,
    fields: [
      {
        name: "language",
        type: { type: "text", pattern: "[a-z0-9+#._-]+" },
        explain: "tag.l.value",
        placeholder: "javascript",
      },
    ],
  },
  textTag("name"),
  {
    name: "extension",
    explain: "tag.extension",
    presence: "optional",
    repeatable: false,
    fields: [
      {
        name: "extension",
        type: { type: "text", pattern: "[A-Za-z0-9_+-]+" },
        explain: "tag.extension.value",
        placeholder: "js",
      },
    ],
  },
  textTag("description"),
  textTag("runtime"),
  {
    name: "license",
    explain: "tag.license",
    presence: "optional",
    repeatable: true,
    fields: [
      {
        name: "spdx",
        type: { type: "text", pattern: "[A-Za-z0-9.+-]+" },
        explain: "tag.license.spdx",
        placeholder: "MIT",
      },
      {
        name: "reference",
        type: { type: "url" },
        explain: "tag.license.reference",
        optional: true,
      },
    ],
  },
  textTag("dep", "optional", true),
  {
    name: "repo",
    explain: "tag.repo",
    presence: "optional",
    repeatable: false,
    fields: [
      {
        name: "repository",
        type: { type: "text", pattern: "https?://\\S+|30617:[0-9a-f]{64}:.+" },
        explain: "tag.repo.target",
      },
      RELAY_HINT,
    ],
  },
];

export const nipC0: NipSpec = {
  nip: "C0",
  variant: "event",
  howItWorks: [
    {
      id: "code",
      title: "how.code.title",
      body: "how.code.body",
      focus: { part: snippet, path: ["content"] },
    },
    {
      id: "language",
      title: "how.language.title",
      body: "how.language.body",
      focus: { part: snippet, path: ["tags", 0] },
    },
    {
      id: "license",
      title: "how.license.title",
      body: "how.license.body",
      focus: { part: snippet, path: ["tags", 5] },
    },
    { id: "repo", title: "how.repo.title", body: "how.repo.body" },
    { id: "client", title: "how.client.title", body: "how.client.body" },
  ],
  related: [
    { nip: "34", relation: "see-also", explain: "related.34" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  events: [
    {
      id: "snippet",
      label: "event.snippet.label",
      explain: "event.snippet.explain",
      kinds: [1337],
      content: { format: "text", explain: "content.code", required: true, multiline: true },
      tags,
      examples: [
        {
          id: "hello",
          label: "example.hello",
          explain: "example.hello.explain",
          signer: "alice",
          template: {
            kind: 1337,
            tags: [
              ["l", "javascript"],
              ["name", "hello-nostr.js"],
              ["extension", "js"],
              ["description", "Prints a greeting to the console"],
              ["runtime", "node v22.11.0"],
              ["license", "MIT"],
              ["repo", "https://github.com/nostr-protocol/nips"],
            ],
            content: "function hello() {\n  console.log('Hello, Nostr!');\n}\n\nhello();\n",
          },
        },
        {
          id: "python",
          label: "example.python",
          explain: "example.python.explain",
          signer: "bob",
          template: {
            kind: 1337,
            tags: [
              ["l", "python"],
              ["name", "quick_sort.py"],
              ["extension", "py"],
              ["description", "Recursive quicksort, written for readability"],
              ["runtime", "python 3.12"],
              ["license", "MIT"],
              ["license", "Apache-2.0", "https://www.apache.org/licenses/LICENSE-2.0"],
              ["repo", `30617:${BOB}:algorithms`, BETA],
            ],
            content:
              "def quick_sort(xs):\n    if len(xs) <= 1:\n        return xs\n    pivot, *rest = xs\n    return (\n        quick_sort([x for x in rest if x < pivot])\n        + [pivot]\n        + quick_sort([x for x in rest if x >= pivot])\n    )\n",
          },
        },
      ],
    },
  ],
};
