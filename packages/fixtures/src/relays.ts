import type { RelayUrl } from "@nostrschool/protocol";
import type { FixtureRelay } from "./types.ts";

/** Fake relays (the `.example` TLD never resolves, so they can't be confused with real ones). */
export const RELAYS: readonly FixtureRelay[] = [
  {
    url: "wss://relay.alpha.example",
    name: "Alpha",
    description: "Big, free, general-purpose relay. Many clients use it to look up profiles.",
    latencyMs: 80,
    paid: false,
  },
  {
    url: "wss://relay.beta.example",
    name: "Beta",
    description: "Community relay run by volunteers. Medium-sized and friendly.",
    latencyMs: 140,
    paid: false,
  },
  {
    url: "wss://relay.gamma.example",
    name: "Gamma",
    description: "Small relay on the other side of the world: slower, but nobody else has it.",
    latencyMs: 220,
    paid: false,
  },
  {
    url: "wss://relay.delta.example",
    name: "Delta",
    description: "Paid relay: only members can write, which keeps spam out.",
    latencyMs: 60,
    paid: true,
  },
];

export const getRelay = (url: RelayUrl): FixtureRelay | undefined =>
  RELAYS.find((r) => r.url === url);
