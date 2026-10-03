/**
 * The four five-friend networks of the sandbox. Same cast everywhere so the only variable
 * the learner changes is the wiring. Coordinates live in a 400 × 300 box.
 */
import type { ModelId, NetworkModel, NodeId, SandboxLink } from "./sandbox.ts";

const both = (from: NodeId, to: NodeId): SandboxLink => ({ from, to });
const oneWay = (from: NodeId, to: NodeId): SandboxLink => ({ from, to, oneWay: true });
const FRIENDS = ["alice", "bob", "carol", "dave", "erin"] as const satisfies readonly NodeId[];

const central: NetworkModel = {
  id: "central",
  nodes: [
    { id: "platform", role: "server", x: 200, y: 150 },
    { id: "alice", role: "user", x: 70, y: 45 },
    { id: "bob", role: "user", x: 330, y: 45 },
    { id: "carol", role: "user", x: 45, y: 205 },
    { id: "dave", role: "user", x: 355, y: 205 },
    { id: "erin", role: "user", x: 200, y: 262 },
  ],
  links: FRIENDS.map((f) => both(f, "platform")),
  outbox: false,
  homes: {
    alice: "platform",
    bob: "platform",
    carol: "platform",
    dave: "platform",
    erin: "platform",
  },
  banAuthority: "platform",
};

// Mastodon-style: each account belongs to one instance; instances federate pairwise.
const federated: NetworkModel = {
  id: "federated",
  nodes: [
    { id: "tea", role: "server", x: 200, y: 95 },
    { id: "coffee", role: "server", x: 95, y: 200 },
    { id: "cocoa", role: "server", x: 305, y: 200 },
    { id: "alice", role: "user", x: 95, y: 40 },
    { id: "bob", role: "user", x: 305, y: 40 },
    { id: "carol", role: "user", x: 40, y: 262 },
    { id: "dave", role: "user", x: 250, y: 262 },
    { id: "erin", role: "user", x: 360, y: 262 },
  ],
  links: [
    both("alice", "tea"),
    both("bob", "tea"),
    both("carol", "coffee"),
    both("dave", "cocoa"),
    both("erin", "cocoa"),
    both("tea", "coffee"),
    both("tea", "cocoa"),
    both("coffee", "cocoa"),
  ],
  outbox: false,
  homes: { alice: "tea", bob: "tea", carol: "coffee", dave: "cocoa", erin: "cocoa" },
  banAuthority: "tea",
};

// Nostr: everyone writes to two relays (their NIP-65 write list); readers' clients go fetch
// from those relays, so no relay has to talk to any other relay.
const nostr: NetworkModel = {
  id: "nostr",
  nodes: [
    { id: "alpha", role: "relay", x: 70, y: 150 },
    { id: "beta", role: "relay", x: 160, y: 150 },
    { id: "gamma", role: "relay", x: 250, y: 150 },
    { id: "delta", role: "relay", x: 340, y: 150 },
    { id: "alice", role: "user", x: 100, y: 40 },
    { id: "bob", role: "user", x: 300, y: 40 },
    { id: "carol", role: "user", x: 330, y: 262 },
    { id: "dave", role: "user", x: 200, y: 262 },
    { id: "erin", role: "user", x: 70, y: 262 },
  ],
  links: [
    both("alice", "alpha"),
    both("alice", "beta"),
    both("bob", "beta"),
    both("bob", "gamma"),
    both("carol", "gamma"),
    both("carol", "delta"),
    both("dave", "delta"),
    both("dave", "alpha"),
    both("erin", "alpha"),
    both("erin", "gamma"),
  ],
  outbox: true,
  homes: {},
  banAuthority: "alpha",
};

// AT Protocol: author → PDS → relay (firehose) → AppView → reader. Most people read through
// one AppView today, so it is drawn as one node.
const bluesky: NetworkModel = {
  id: "bluesky",
  nodes: [
    { id: "pdsBig", role: "server", x: 100, y: 45 },
    { id: "pdsHome", role: "server", x: 262, y: 45 },
    { id: "firehose", role: "relay", x: 365, y: 150 },
    { id: "appview", role: "server", x: 200, y: 265 },
    { id: "alice", role: "user", x: 35, y: 150 },
    { id: "bob", role: "user", x: 100, y: 150 },
    { id: "carol", role: "user", x: 165, y: 150 },
    { id: "dave", role: "user", x: 230, y: 150 },
    { id: "erin", role: "user", x: 295, y: 150 },
  ],
  links: [
    oneWay("alice", "pdsBig"),
    oneWay("bob", "pdsBig"),
    oneWay("carol", "pdsBig"),
    oneWay("dave", "pdsHome"),
    oneWay("erin", "pdsHome"),
    oneWay("pdsBig", "firehose"),
    oneWay("pdsHome", "firehose"),
    oneWay("firehose", "appview"),
    ...FRIENDS.map((f) => oneWay("appview", f)),
  ],
  outbox: false,
  homes: { alice: "pdsBig", bob: "pdsBig", carol: "pdsBig", dave: "pdsHome", erin: "pdsHome" },
  banAuthority: "appview",
};

export const MODEL_IDS = [
  "central",
  "federated",
  "nostr",
  "bluesky",
] as const satisfies readonly ModelId[];

export const MODELS: Readonly<Record<ModelId, NetworkModel>> = {
  central,
  federated,
  nostr,
  bluesky,
};
