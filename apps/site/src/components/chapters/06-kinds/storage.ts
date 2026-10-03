/**
 * What a relay keeps when an event arrives, per NIP-01 storage rules. Powers the
 * "relay storage simulator": the same publish sequence behaves differently per category.
 */
import { getPersona } from "@nostrschool/fixtures";
import {
  classifyKind,
  eventAddress,
  type KeyError,
  type KindCategory,
  type NostrEvent,
  type Result,
  signEvent,
  type Tag,
} from "@nostrschool/protocol";

export type StoreOutcome = "stored" | "replaced" | "ignored-older" | "forwarded" | "duplicate";

export interface StoreResult {
  readonly stored: readonly NostrEvent[];
  readonly outcome: StoreOutcome;
}

/** Replaceable key: kind:pubkey; addressable adds the d tag (eventAddress yields "kind:pubkey:d"). */
const slotKey = (e: NostrEvent, category: KindCategory): string =>
  category === "addressable" ? eventAddress(e) : `${e.kind}:${e.pubkey}`;

/**
 * NIP-01: newer created_at wins; on a tie the LOWEST id (lexical order) is kept, so every
 * relay converges on the same winner regardless of arrival order.
 */
export const supersedes = (incoming: NostrEvent, current: NostrEvent): boolean =>
  incoming.created_at > current.created_at ||
  (incoming.created_at === current.created_at && incoming.id < current.id);

export const storeOnRelay = (stored: readonly NostrEvent[], incoming: NostrEvent): StoreResult => {
  const category = classifyKind(incoming.kind);
  if (category === "ephemeral") return { stored, outcome: "forwarded" };
  if (stored.some((e) => e.id === incoming.id)) return { stored, outcome: "duplicate" };
  if (category === "regular") return { stored: [...stored, incoming], outcome: "stored" };
  const key = slotKey(incoming, category);
  const current = stored.find((e) => slotKey(e, classifyKind(e.kind)) === key);
  if (current === undefined) return { stored: [...stored, incoming], outcome: "stored" };
  if (!supersedes(incoming, current)) return { stored, outcome: "ignored-older" };
  return {
    stored: stored.map((e) => (e === current ? incoming : e)),
    outcome: "replaced",
  };
};

/** The demo kind used by the simulator for each category. */
export const DEMO_KINDS: Readonly<Record<KindCategory, number>> = {
  regular: 1,
  replaceable: 0,
  ephemeral: 24133,
  addressable: 30023,
};

export type ArticleSlot = "a" | "b";

export interface DemoPublish {
  readonly category: KindCategory;
  /** 1-based version number (also drives created_at, one minute apart). */
  readonly version: number;
  readonly slot: ArticleSlot;
  readonly createdAt: number;
}

const demoTemplate = ({
  category,
  version,
  slot,
}: DemoPublish): {
  tags: readonly Tag[];
  content: string;
} => {
  switch (category) {
    case "regular":
      return { tags: [], content: `Note number ${version}` };
    case "replaceable":
      return { tags: [], content: JSON.stringify({ name: "alice", about: `bio v${version}` }) };
    case "ephemeral":
      return { tags: [["p", getPersona("frank").pubkey]], content: `ping ${version}` };
    case "addressable":
      return { tags: [["d", slot]], content: `# Article ${slot}\n\nRevision ${version}` };
  }
};

const AUX_RAND = new Uint8Array(32);

/** Signs a real demo event with Alice's key (reproducible bytes, real id ordering for ties). */
export const signDemo = (p: DemoPublish): Result<NostrEvent, KeyError> => {
  const { tags, content } = demoTemplate(p);
  const signed = signEvent(
    { kind: DEMO_KINDS[p.category], created_at: p.createdAt, tags, content },
    getPersona("alice").secretKey,
    { auxRand: AUX_RAND },
  );
  return signed.ok ? { ok: true, value: signed.value.event } : signed;
};

/** Version number we put in the demo content, recovered for labels. */
export const versionOf = (e: NostrEvent): number => {
  const match = /(\d+)\D*$/.exec(e.content);
  return match?.[1] === undefined ? 0 : Number(match[1]);
};

export const dTagOf = (e: NostrEvent): string | undefined => e.tags.find((t) => t[0] === "d")?.[1];
