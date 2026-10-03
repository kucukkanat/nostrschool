// Owner: spec author r6 (NIPs with letter ids). Shared constants and tag builders for the r6
// specs, so persona keys and the NIP-22 comment tags are written once. Every TextKey a builder
// emits must exist in the using NIP's strings (packages/i18n/src/locales/en/nips/r6.ts).
import type { TagFieldSpec, TagSpec } from "../spec.ts";

/** Same as @nostrschool/fixtures FIXTURE_NOW (nips does not depend on fixtures). */
export const FIXTURE_NOW = 1735689600;

/** Fixture persona pubkeys (r6.test.ts checks them against the demo keys). */
export const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
export const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
export const CAROL = "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4";
export const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";
export const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
export const GRACE = "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812";

export const ALPHA = "wss://relay.alpha.example";
export const BETA = "wss://relay.beta.example";

/** Optional relay hint field; every NIP using it defines the "tag.relay" text. */
export const RELAY_HINT: TagFieldSpec = {
  name: "relay",
  type: { type: "relay-url" },
  explain: "tag.relay",
  optional: true,
};

/** A one-value text tag ("title", "name", "description"…), explained by `tag.<name>`. */
export const textTag = (
  name: string,
  presence: TagSpec["presence"] = "optional",
  repeatable = false,
): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence,
  repeatable,
  fields: [{ name: "value", type: { type: "text", minLength: 1 }, explain: `tag.${name}.value` }],
});

/**
 * NIP-22 comment tags for a reply whose root and parent are the same event of `kind`
 * (top-level comment). Upper case = root, lower case = parent. Keys: tag.root.*, tag.parent.*.
 */
export const commentTags = (
  kinds: readonly number[],
  target: "event" | "address",
): readonly TagSpec[] =>
  (["root", "parent"] as const).flatMap((area) => {
    const c = (n: string) => (area === "root" ? n.toUpperCase() : n);
    const pointer: TagSpec =
      target === "event"
        ? {
            name: c("e"),
            explain: `tag.${area}.e`,
            presence: "required",
            repeatable: false,
            fields: [
              { name: "event-id", type: { type: "event-id" }, explain: `tag.${area}.e.id` },
              RELAY_HINT,
              {
                name: "pubkey",
                type: { type: "pubkey" },
                explain: `tag.${area}.e.pubkey`,
                optional: true,
              },
            ],
          }
        : {
            name: c("a"),
            explain: `tag.${area}.a`,
            presence: "required",
            repeatable: false,
            fields: [
              {
                name: "address",
                type: { type: "addr", kinds },
                explain: `tag.${area}.a.addr`,
              },
              RELAY_HINT,
            ],
          };
    return [
      pointer,
      {
        name: c("k"),
        explain: `tag.${area}.k`,
        presence: "required",
        repeatable: false,
        fields: [{ name: "kind", type: { type: "kind", kinds }, explain: `tag.${area}.k.kind` }],
      },
      {
        name: c("p"),
        explain: `tag.${area}.p`,
        presence: "recommended",
        repeatable: false,
        fields: [
          { name: "pubkey", type: { type: "pubkey" }, explain: `tag.${area}.p.pubkey` },
          RELAY_HINT,
        ],
      },
    ];
  });
