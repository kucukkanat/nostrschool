import { describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import { MODEL_IDS, MODELS } from "./models.ts";
import {
  accountOf,
  analyze,
  canReach,
  INITIAL_STATE,
  infra,
  type NetworkModel,
  narrate,
  type SandboxState,
  toggleBan,
  toggleDown,
  users,
  validateModel,
  verdictOf,
  voiceOf,
  worstSingleOutage,
} from "./sandbox.ts";

const t = getDictionary("en").chapters.ch01.sandbox;
const join = (names: readonly string[]): string => names.join(", ");
const { central, federated, nostr, bluesky } = MODELS;
const state = (down: SandboxState["down"], banned = false): SandboxState => ({ down, banned });

describe("validateModel", () => {
  test("every shipped model is valid", () => {
    for (const id of MODEL_IDS) expect(validateModel(MODELS[id]).ok).toBe(true);
  });

  const broken = (patch: Partial<NetworkModel>): string => {
    const r = validateModel({ ...central, ...patch });
    return r.ok ? "ok" : r.error.code;
  };

  test("rejects duplicate nodes", () => {
    const first = central.nodes[0];
    expect(first).toBeDefined();
    if (first) expect(broken({ nodes: [...central.nodes, first] })).toBe("duplicate-node");
  });
  test("rejects links to unknown nodes", () => {
    expect(broken({ links: [{ from: "alice", to: "appview" }] })).toBe("unknown-node");
    expect(broken({ links: [{ from: "appview", to: "alice" }] })).toBe("unknown-node");
  });
  test("rejects homes that are not user → infra", () => {
    expect(broken({ homes: { alice: "bob" } })).toBe("invalid-home");
    expect(broken({ homes: { platform: "platform" } })).toBe("invalid-home");
    expect(broken({ homes: { alice: "appview" } })).toBe("invalid-home");
    // Untyped input (e.g. JSON) can carry explicit undefined values.
    const holey: Readonly<Record<string, undefined>> = { alice: undefined };
    expect(broken({ homes: holey as unknown as NetworkModel["homes"] })).toBe("invalid-home");
  });
  test("rejects a ban authority that is a user or missing", () => {
    expect(broken({ banAuthority: "bob" })).toBe("invalid-ban");
    expect(broken({ banAuthority: "appview" })).toBe("invalid-ban");
    expect(
      broken({
        nodes: central.nodes.filter((n) => n.id !== "alice"),
        links: [],
        homes: {},
      }),
    ).toBe("invalid-ban");
  });
});

describe("node helpers", () => {
  test("users and infra partition the nodes", () => {
    expect(users(central)).toEqual(["alice", "bob", "carol", "dave", "erin"]);
    expect(infra(central)).toEqual(["platform"]);
    expect(infra(bluesky)).toEqual(["pdsBig", "pdsHome", "firehose", "appview"]);
  });
});

describe("canReach", () => {
  test("nobody talks to themselves", () => {
    expect(canReach(central, INITIAL_STATE, "alice", "alice")).toBe(false);
  });
  test("users are never transit nodes", () => {
    const chain: NetworkModel = {
      ...central,
      links: [
        { from: "alice", to: "platform" },
        { from: "platform", to: "bob" },
        { from: "bob", to: "carol" },
      ],
    };
    expect(canReach(chain, INITIAL_STATE, "alice", "bob")).toBe(true);
    expect(canReach(chain, INITIAL_STATE, "alice", "carol")).toBe(false);
  });
  test("one-way links only carry posts forward", () => {
    expect(canReach(bluesky, INITIAL_STATE, "alice", "dave")).toBe(true);
    expect(canReach(bluesky, state(["appview"]), "alice", "dave")).toBe(false);
  });
  test("nodes without outgoing links reach nobody", () => {
    const isolated: NetworkModel = { ...central, links: [] };
    expect(canReach(isolated, INITIAL_STATE, "alice", "bob")).toBe(false);
  });
  test("a ban blocks posts from and to the banned user at the authority only", () => {
    const banned = state([], true);
    expect(canReach(central, banned, "alice", "bob")).toBe(false);
    expect(canReach(central, banned, "bob", "alice")).toBe(false);
    expect(canReach(central, banned, "bob", "carol")).toBe(true);
    expect(canReach(nostr, banned, "alice", "bob")).toBe(true); // via beta
    expect(canReach(nostr, banned, "dave", "alice")).toBe(true); // via delta
  });
  test("outbox: a reader fetches from any relay the author writes to", () => {
    expect(canReach(nostr, state(["alpha"]), "alice", "carol")).toBe(true);
    expect(canReach(nostr, state(["alpha", "beta"]), "alice", "carol")).toBe(false);
  });
});

describe("analyze", () => {
  test("everything up: every conversation works", () => {
    for (const id of MODEL_IDS) {
      const a = analyze(MODELS[id], INITIAL_STATE);
      expect(a.alivePairs).toBe(20);
      expect(a.totalPairs).toBe(20);
      expect(a.silenced).toEqual([]);
      expect(a.users.every((u) => u.voice === "full" && u.bannedBy === null)).toBe(true);
    }
  });
  test("centralized: one dead server silences everyone", () => {
    const a = analyze(central, state(["platform"]));
    expect(a.alivePairs).toBe(0);
    expect(a.silenced).toHaveLength(5);
    expect(a.users[0]?.account).toEqual({ kind: "lost", host: "platform" });
  });
  test("federated: a dead instance takes its accounts with it", () => {
    const a = analyze(federated, state(["tea"]));
    expect(a.silenced).toEqual(["alice", "bob"]);
    expect(a.alivePairs).toBe(6);
    expect(a.users.find((u) => u.id === "carol")?.voice).toBe("partial");
  });
  test("nostr: a ban by one relay is a shrug", () => {
    const a = analyze(nostr, state([], true));
    expect(a.alivePairs).toBe(20);
    expect(a.users[0]).toMatchObject({ account: { kind: "keys" }, bannedBy: "alpha" });
  });
  test("bluesky: the AppView ban hides Alice but her PDS account survives", () => {
    const a = analyze(bluesky, state([], true));
    expect(a.users[0]).toMatchObject({
      voice: "silenced",
      account: { kind: "hosted", host: "pdsBig" },
      bannedBy: "appview",
    });
  });
});

describe("accountOf / voiceOf / verdictOf", () => {
  test("account states", () => {
    expect(accountOf(central, INITIAL_STATE, "bob")).toEqual({ kind: "hosted", host: "platform" });
    expect(accountOf(central, state([], true), "alice")).toEqual({
      kind: "banned",
      host: "platform",
    });
    expect(accountOf(central, state([], true), "bob")).toEqual({
      kind: "hosted",
      host: "platform",
    });
    expect(accountOf(nostr, state(["alpha"]), "alice")).toEqual({ kind: "keys" });
  });
  test("voice thresholds", () => {
    expect(voiceOf(0, 4)).toBe("silenced");
    expect(voiceOf(2, 4)).toBe("partial");
    expect(voiceOf(4, 4)).toBe("full");
  });
  test("verdicts", () => {
    expect(verdictOf(analyze(nostr, INITIAL_STATE))).toBe("allGood");
    expect(verdictOf(analyze(federated, state(["tea"])))).toBe("degraded");
    expect(verdictOf(analyze(central, state(["platform"])))).toBe("collapsed");
  });
});

describe("state transitions are immutable", () => {
  test("toggleDown adds then removes", () => {
    const once = toggleDown(INITIAL_STATE, "alpha");
    expect(once.down).toEqual(["alpha"]);
    expect(INITIAL_STATE.down).toEqual([]);
    expect(toggleDown(once, "alpha").down).toEqual([]);
  });
  test("toggleBan flips", () => {
    expect(toggleBan(INITIAL_STATE).banned).toBe(true);
    expect(toggleBan(toggleBan(INITIAL_STATE)).banned).toBe(false);
  });
});

describe("worstSingleOutage", () => {
  test("ranks the models the way the chapter claims", () => {
    expect(worstSingleOutage(central)).toEqual({
      node: "platform",
      alivePairs: 0,
      totalPairs: 20,
      percent: 0,
    });
    expect(worstSingleOutage(federated)).toMatchObject({ node: "tea", percent: 30 });
    expect(worstSingleOutage(nostr)).toMatchObject({ node: "alpha", percent: 100 });
    expect(worstSingleOutage(bluesky)).toMatchObject({ node: "firehose", percent: 0 });
  });
});

describe("narrate", () => {
  test("describes each change, who went silent, and the overall health", () => {
    const down = state(["tea"]);
    expect(
      narrate(t, federated, { type: "down", node: "tea" }, analyze(federated, down), join),
    ).toBe("tea.social went offline. Silenced: Alice, Bob. 6 of 20 conversations still work.");
    expect(
      narrate(t, federated, { type: "up", node: "tea" }, analyze(federated, INITIAL_STATE), join),
    ).toBe(
      "tea.social is back online. Nobody lost their voice. 20 of 20 conversations still work.",
    );
    const banned = analyze(central, state([], true));
    expect(narrate(t, central, { type: "banned" }, banned, join)).toStartWith(
      "BigCo banned Alice. Silenced: Alice.",
    );
    const fine = analyze(central, INITIAL_STATE);
    expect(narrate(t, central, { type: "unbanned" }, fine, join)).toStartWith(
      "BigCo lifted the ban on Alice.",
    );
    expect(narrate(t, central, { type: "reset" }, fine, join)).toStartWith(
      "Everything is back online.",
    );
    expect(narrate(t, nostr, { type: "model" }, fine, join)).toStartWith(
      "Switched to the Nostr model.",
    );
  });
});
