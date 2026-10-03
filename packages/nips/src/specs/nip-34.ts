// Owner: spec author r2 (NIPs 20–39). NIP-34: git stuff.
// Demo cast: Dave maintains the "delta-relay" repository; Bob sends a patch, Alice a pull
// request, Grace opens an issue, and Dave marks Bob's patch as applied.
// State tags (kind 30618) are named after the ref itself ("refs/heads/main"), so they can't be
// declared as TagSpecs; that shape allows unknown tags and explains them on the HEAD tag.
import type { FieldType, NipSpec, TagSpec } from "../spec.ts";

const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";
const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const REPO = `30617:${DAVE}:delta-relay`;
const RELAY = "wss://relay.delta.example";
const EUC = "9c1f0e4b7a2d5c8e3f6a1b4d7c0e2f5a8b3d6c9e";
const HEAD = "b52e8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b";
const COMMIT = "e7a0c3f6b9d2e5a8c1f4b7d0a3e6c9f2b5d8a1c4";
const PR_TIP = "3d6f9b2e5a8c1d4f7b0e3a6c9d2f5b8e1a4c7d0f";
// Id of the "patch" example (kind 1617 by bob at FIXTURE_NOW); r2.test.ts recomputes it.
export const NIP34_PATCH_ID = "4212475bb21fa3e7851c11808ba350a13c47508f8cc35587cbda7b1517be2624";
// Id of the "pr" example (kind 1618 by alice at FIXTURE_NOW); r2.test.ts recomputes it.
export const NIP34_PR_ID = "1f7a9e071050669ca59247ce295021084280d55dd5995e44c8504920b1d5abcd";

const commit: FieldType = { type: "hex", bytes: 20 };
const gitUrl: FieldType = { type: "url", schemes: ["https", "http", "ssh", "git", "nostr"] };

const repoA: TagSpec = {
  name: "a",
  explain: "tag.a",
  presence: "required",
  repeatable: false,
  fields: [
    { name: "repository", type: { type: "addr", kinds: [30617] }, explain: "tag.a.addr" },
    { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
  ],
};
const repoOptionalA: TagSpec = { ...repoA, presence: "optional" };

const rCommit: TagSpec = {
  name: "r",
  explain: "tag.r",
  presence: "recommended",
  repeatable: true,
  fields: [{ name: "commit", type: commit, explain: "tag.r.commit" }],
};

const pTag: TagSpec = {
  name: "p",
  explain: "tag.p",
  presence: "recommended",
  repeatable: true,
  fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }],
};

const one = (
  name: string,
  type: FieldType,
  presence: TagSpec["presence"] = "optional",
): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence,
  repeatable: false,
  fields: [{ name, type, explain: `tag.${name}.value` }],
});

const many = (
  name: string,
  type: FieldType,
  presence: TagSpec["presence"] = "optional",
): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence,
  repeatable: false,
  fields: [{ name, type, explain: `tag.${name}.value` }],
  rest: { name, type, explain: `tag.${name}.value` },
});

const labels: TagSpec = {
  name: "t",
  explain: "tag.t",
  presence: "optional",
  repeatable: true,
  fields: [{ name: "label", type: { type: "text" }, explain: "tag.t.value" }],
};

const statusE = (marker: "root" | "reply"): TagSpec => ({
  id: `e-${marker}`,
  name: "e",
  explain: `tag.e-${marker}`,
  presence: marker === "root" ? "required" : "optional",
  repeatable: false,
  when: { index: 3, equals: marker },
  template: ["e", "", "", marker],
  fields: [
    { name: "event-id", type: { type: "event-id" }, explain: `tag.e-${marker}.id` },
    { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
    {
      name: "marker",
      type: { type: "enum", values: [{ value: marker }] },
      explain: "tag.marker",
    },
  ],
});

const markdown = { format: "text", explain: "content.markdown", multiline: true } as const;

export const nip34: NipSpec = {
  nip: "34",
  variant: "event",
  howItWorks: [
    {
      id: "announce",
      title: "how.announce.title",
      body: "how.announce.body",
      focus: { part: { kind: "event", id: "repo" } },
    },
    {
      id: "euc",
      title: "how.euc.title",
      body: "how.euc.body",
      focus: { part: { kind: "event", id: "repo" }, path: ["tags", 6] },
    },
    {
      id: "patch",
      title: "how.patch.title",
      body: "how.patch.body",
      focus: { part: { kind: "event", id: "patch" } },
    },
    {
      id: "pr",
      title: "how.pr.title",
      body: "how.pr.body",
      focus: { part: { kind: "event", id: "pr" } },
    },
    {
      id: "issues",
      title: "how.issues.title",
      body: "how.issues.body",
      focus: { part: { kind: "event", id: "issue" } },
    },
    {
      id: "status",
      title: "how.status.title",
      body: "how.status.body",
      focus: { part: { kind: "event", id: "status" }, path: ["kind"] },
    },
  ],
  related: [
    { nip: "22", relation: "depends-on", explain: "related.22" },
    { nip: "10", relation: "depends-on", explain: "related.10" },
    { nip: "19", relation: "see-also", explain: "related.19" },
    { nip: "65", relation: "see-also", explain: "related.65" },
  ],
  flows: [
    {
      id: "contribute",
      label: "flow.contribute.label",
      explain: "flow.contribute.explain",
      steps: [
        { part: { kind: "event", id: "repo" }, explain: "flow.contribute.repo" },
        { part: { kind: "event", id: "patch" }, explain: "flow.contribute.patch" },
        { part: { kind: "event", id: "status" }, explain: "flow.contribute.status" },
        { part: { kind: "event", id: "state" }, explain: "flow.contribute.state" },
      ],
    },
  ],
  events: [
    {
      id: "repo",
      label: "event.repo.label",
      explain: "event.repo.explain",
      kinds: [30617],
      content: { format: "empty" },
      tags: [
        one("d", { type: "text", pattern: "[^\\s]+" }, "required"),
        one("name", { type: "text" }),
        one("description", { type: "text", multiline: true }),
        many("web", { type: "url" }),
        many("clone", gitUrl),
        many("relays", { type: "relay-url" }),
        {
          id: "r-euc",
          name: "r",
          explain: "tag.r-euc",
          presence: "recommended",
          repeatable: false,
          when: { index: 2, equals: "euc" },
          template: ["r", "", "euc"],
          fields: [
            { name: "commit", type: commit, explain: "tag.r-euc.commit" },
            {
              name: "marker",
              type: { type: "enum", values: [{ value: "euc" }] },
              explain: "tag.r-euc.marker",
            },
          ],
        },
        many("maintainers", { type: "pubkey" }),
        {
          name: "u",
          explain: "tag.u",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "upstream", type: { type: "text", minLength: 1 }, explain: "tag.u.value" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.u.pubkey", optional: true },
          ],
        },
        labels,
      ],
      examples: [
        {
          id: "repo",
          label: "example.repo",
          explain: "example.repo.explain",
          signer: "dave",
          template: {
            kind: 30617,
            tags: [
              ["d", "delta-relay"],
              ["name", "delta-relay"],
              ["description", "The paid, members-only relay behind relay.delta.example."],
              ["web", "https://git.delta.example/delta-relay"],
              ["clone", "https://git.delta.example/delta-relay.git"],
              ["relays", RELAY, "wss://relay.alpha.example"],
              ["r", EUC, "euc"],
              ["maintainers", ALICE],
              ["t", "relay"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "state",
      label: "event.state.label",
      explain: "event.state.explain",
      kinds: [30618],
      content: { format: "empty" },
      tags: [
        one("d", { type: "text", pattern: "[^\\s]+" }, "required"),
        one("HEAD", { type: "text", pattern: "ref: refs/heads/.+" }, "recommended"),
      ],
      examples: [
        {
          id: "state",
          label: "example.state",
          explain: "example.state.explain",
          signer: "dave",
          template: {
            kind: 30618,
            tags: [
              ["d", "delta-relay"],
              ["refs/heads/main", COMMIT],
              ["refs/tags/v1.2.0", HEAD],
              ["HEAD", "ref: refs/heads/main"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "patch",
      label: "event.patch.label",
      explain: "event.patch.explain",
      kinds: [1617],
      content: { format: "text", explain: "content.patch", required: true, multiline: true },
      tags: [
        repoA,
        rCommit,
        pTag,
        {
          name: "t",
          explain: "tag.t-patch",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "marker",
              type: {
                type: "enum",
                values: [
                  { value: "root", explain: "marker.root" },
                  { value: "root-revision", explain: "marker.root-revision" },
                ],
                open: true,
              },
              explain: "tag.t-patch.value",
            },
          ],
        },
        {
          name: "e",
          explain: "tag.e-previous",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.e-previous.id" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
            {
              name: "marker",
              type: { type: "enum", values: [{ value: "reply" }] },
              explain: "tag.marker",
              optional: true,
            },
          ],
        },
        one("commit", commit),
        one("parent-commit", commit),
        one("commit-pgp-sig", { type: "text", multiline: true }),
        {
          name: "committer",
          explain: "tag.committer",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "name", type: { type: "text" }, explain: "tag.committer.name" },
            { name: "email", type: { type: "text" }, explain: "tag.committer.email" },
            { name: "timestamp", type: { type: "timestamp" }, explain: "tag.committer.timestamp" },
            {
              name: "tz-offset",
              type: { type: "number", integer: true },
              explain: "tag.committer.tz",
            },
          ],
        },
      ],
      examples: [
        {
          id: "patch",
          label: "example.patch",
          explain: "example.patch.explain",
          signer: "bob",
          template: {
            kind: 1617,
            tags: [
              ["a", REPO],
              ["r", EUC],
              ["p", DAVE],
              ["t", "root"],
              ["commit", COMMIT],
              ["r", COMMIT],
              ["parent-commit", HEAD],
              ["committer", "Bob", "bob@beta.example", "1735689000", "0"],
            ],
            content:
              'From e7a0c3f6b9d2e5a8c1f4b7d0a3e6c9f2b5d8a1c4 Mon Sep 17 00:00:00 2001\nFrom: Bob <bob@beta.example>\nDate: Wed, 1 Jan 2025 00:00:00 +0000\nSubject: [PATCH] Return rate-limited: when a client publishes too fast\n\n---\n src/policy.ts | 2 +-\n 1 file changed, 1 insertion(+), 1 deletion(-)\n\ndiff --git a/src/policy.ts b/src/policy.ts\n--- a/src/policy.ts\n+++ b/src/policy.ts\n@@ -12 +12 @@\n-  return reject("too fast");\n+  return reject("rate-limited: slow down");\n',
          },
        },
      ],
    },
    {
      id: "pr",
      label: "event.pr.label",
      explain: "event.pr.explain",
      kinds: [1618],
      content: markdown,
      tags: [
        repoA,
        rCommit,
        pTag,
        one("subject", { type: "text" }, "recommended"),
        labels,
        one("c", commit, "required"),
        many("clone", gitUrl, "required"),
        one("branch-name", { type: "text" }),
        {
          name: "e",
          explain: "tag.e-revises",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "event-id", type: { type: "event-id" }, explain: "tag.e-revises.id" }],
        },
        one("merge-base", commit),
      ],
      examples: [
        {
          id: "pr",
          label: "example.pr",
          signer: "alice",
          template: {
            kind: 1618,
            tags: [
              ["a", REPO],
              ["r", EUC],
              ["p", DAVE],
              ["subject", "Add NIP-42 auth for paid members"],
              ["t", "enhancement"],
              ["c", PR_TIP],
              ["clone", "https://git.alpha.example/alice/delta-relay.git"],
              ["branch-name", "nip42-auth"],
              ["merge-base", COMMIT],
            ],
            content:
              "Members now log in with NIP-42 before writing.\n\n- Sends `auth-required:` on unauthenticated EVENTs\n- Tests included",
          },
        },
      ],
    },
    {
      id: "pr-update",
      label: "event.pr-update.label",
      explain: "event.pr-update.explain",
      kinds: [1619],
      content: { format: "empty" },
      tags: [
        repoA,
        rCommit,
        pTag,
        one("E", { type: "event-id" }, "required"),
        one("P", { type: "pubkey" }, "recommended"),
        one("c", commit, "required"),
        many("clone", gitUrl, "required"),
        one("merge-base", commit),
      ],
      examples: [
        {
          id: "pr-update",
          label: "example.pr-update",
          signer: "alice",
          template: {
            kind: 1619,
            tags: [
              ["a", REPO],
              ["r", EUC],
              ["p", DAVE],
              ["E", NIP34_PR_ID],
              ["P", ALICE],
              ["c", "8b1e4a7d0c3f6b9e2a5d8c1f4b7e0a3d6c9f2b5e"],
              ["clone", "https://git.alpha.example/alice/delta-relay.git"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "issue",
      label: "event.issue.label",
      explain: "event.issue.explain",
      kinds: [1621],
      content: markdown,
      tags: [repoA, pTag, one("subject", { type: "text" }, "recommended"), labels],
      examples: [
        {
          id: "issue",
          label: "example.issue",
          signer: "grace",
          template: {
            kind: 1621,
            tags: [
              ["a", REPO],
              ["p", DAVE],
              ["subject", "Payment page shows the wrong price"],
              ["t", "bug"],
            ],
            content:
              "The sign-up page says 5,000 sats but the invoice asks for 10,000. Which one is right?",
          },
        },
      ],
    },
    {
      id: "status",
      label: "event.status.label",
      explain: "event.status.explain",
      kinds: [{ from: 1630, to: 1633 }],
      content: markdown,
      tags: [
        statusE("root"),
        statusE("reply"),
        pTag,
        repoOptionalA,
        { ...rCommit, presence: "optional" },
        {
          name: "q",
          explain: "tag.q",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.q.id" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.q.pubkey", optional: true },
          ],
        },
        one("merge-commit", commit),
        many("applied-as-commits", commit),
      ],
      examples: [
        {
          id: "applied",
          label: "example.applied",
          explain: "example.applied.explain",
          signer: "dave",
          template: {
            kind: 1631,
            tags: [
              ["e", NIP34_PATCH_ID, "", "root"],
              ["p", DAVE],
              ["p", BOB],
              ["a", REPO, RELAY],
              ["r", EUC],
              ["q", NIP34_PATCH_ID, RELAY, BOB],
              ["applied-as-commits", COMMIT],
              ["r", COMMIT],
            ],
            content: "Applied, thanks Bob! Shipping in v1.2.1.",
          },
        },
        {
          id: "closed",
          label: "example.closed",
          signer: "dave",
          template: {
            kind: 1632,
            tags: [
              ["e", NIP34_PATCH_ID, "", "root"],
              ["p", BOB],
            ],
            content: "Closing: superseded by Alice's pull request.",
          },
        },
      ],
    },
    {
      id: "grasp",
      label: "event.grasp.label",
      explain: "event.grasp.explain",
      kinds: [10317],
      content: { format: "empty" },
      tags: [
        {
          name: "g",
          explain: "tag.g",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "url", type: { type: "relay-url" }, explain: "tag.g.value" }],
        },
      ],
      examples: [
        {
          id: "grasp",
          label: "example.grasp",
          signer: "bob",
          template: {
            kind: 10317,
            tags: [
              ["g", "wss://grasp.delta.example"],
              ["g", "wss://grasp.beta.example"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
