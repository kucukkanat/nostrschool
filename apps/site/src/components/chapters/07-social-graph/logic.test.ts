import { describe, expect, test } from "bun:test";
import { getPersona, type PersonaId } from "@nostrschool/fixtures";
import { parseClientMessage, verifyEvent } from "@nostrschool/protocol";
import {
  followsOf,
  framesUpTo,
  INDEXER,
  minimalCover,
  type OutboxInput,
  outboxPlan,
  outboxScene,
  readRelays,
  replyEvent,
  replyTargets,
  STEPS,
  stepAt,
  writeRelays,
} from "./outbox.ts";
import {
  buildFollowList,
  CANDIDATES,
  followsInEvent,
  followTag,
  lostFollows,
  newestReplaceable,
  OWNER,
  publish,
  relayKeeps,
  TABLET_FOLLOWS,
  toggle,
} from "./replace.ts";
import {
  FOLLOWS,
  followEdges,
  indexFollows,
  isMutual,
  isPersonaId,
  lensIds,
  listNames,
  networkStats,
  toGraph,
} from "./social.ts";

const ALPHA = "wss://relay.alpha.example";
const BETA = "wss://relay.beta.example";
const GAMMA = "wss://relay.gamma.example";
const DELTA = "wss://relay.delta.example";
const names = (l: readonly string[]): string => l.join(", ");
const input = (o: Partial<OutboxInput> = {}): OutboxInput => ({
  viewer: "erin",
  mode: "outbox",
  singleRelay: ALPHA,
  recipient: "carol",
  ...o,
});

describe("social graph", () => {
  test("indexes the fixture kind 3 lists both ways", () => {
    expect(followEdges()).toHaveLength(25);
    expect(FOLLOWS.follows.get("erin")).toEqual(["alice", "carol", "frank", "grace"]);
    expect(FOLLOWS.followers.get("alice")).toEqual([
      "bob",
      "carol",
      "dave",
      "erin",
      "frank",
      "grace",
    ]);
    expect(FOLLOWS.followers.get("grace")).toEqual(["carol", "erin"]);
  });

  test("lenses, mutuals and the persona guard", () => {
    expect(lensIds(FOLLOWS, "grace", "follows")).toEqual(["alice", "bob", "erin"]);
    expect(lensIds(FOLLOWS, "grace", "followers")).toEqual(["carol", "erin"]);
    expect(isMutual(FOLLOWS, "erin", "grace")).toBe(true);
    expect(isMutual(FOLLOWS, "carol", "grace")).toBe(false);
    expect(isPersonaId("bob")).toBe(true);
    expect(isPersonaId("mallory")).toBe(false);
    const empty = indexFollows([]);
    expect(lensIds(empty, "alice", "follows")).toEqual([]);
    expect(lensIds({ follows: new Map(), followers: new Map() }, "alice", "follows")).toEqual([]);
  });

  test("toGraph draws each mutual pair once", () => {
    const g = toGraph(FOLLOWS);
    expect(g.nodes.map((n) => n.id)).toEqual([
      "alice",
      "bob",
      "carol",
      "dave",
      "erin",
      "frank",
      "grace",
    ]);
    expect(g.nodes[0]?.avatar).toStartWith("data:image/svg+xml");
    const mutual = g.links.filter((l) => l.kind === "mutual");
    expect(mutual).toHaveLength(11);
    expect(g.links).toHaveLength(25 - 11);
    expect(g.links).toContainEqual({ source: "carol", target: "grace", kind: "follows" });
    expect(g.links).not.toContainEqual({ source: "grace", target: "erin", kind: "mutual" });
  });

  test("network stats", () => {
    expect(networkStats(FOLLOWS)).toEqual({
      people: 7,
      links: 25,
      mutualPairs: 11,
      mostFollowed: { id: "alice", count: 6 },
    });
    expect(networkStats(indexFollows([])).mostFollowed).toEqual({ id: "alice", count: 0 });
    const sparse = { follows: new Map(), followers: new Map() };
    expect(networkStats(sparse)).toMatchObject({ links: 0, mutualPairs: 0 });
  });

  test("listNames is locale-aware", () => {
    expect(listNames("en", ["Alice", "Bob", "Carol"], "-")).toBe("Alice, Bob, and Carol");
    expect(listNames("es", ["Alice", "Bob"], "-")).toBe("Alice y Bob");
    expect(listNames("en", [], "Nobody")).toBe("Nobody");
  });
});

describe("outbox planning (NIP-65)", () => {
  test("read/write relays come from kind 10002", () => {
    expect(writeRelays("carol")).toEqual([GAMMA, ALPHA]);
    expect(readRelays("carol")).toEqual([GAMMA]);
    expect(writeRelays("dave")).toEqual([DELTA, ALPHA]);
    expect(readRelays("bob")).toEqual([BETA, GAMMA]);
    expect(followsOf("erin")).toEqual(["alice", "carol", "frank", "grace"]);
  });

  test("plan groups authors by write relay; the minimal cover is smaller", () => {
    const erin = followsOf("erin");
    expect(outboxPlan(erin)).toEqual([
      { relay: ALPHA, authors: ["alice", "carol"] },
      { relay: BETA, authors: ["alice", "frank"] },
      { relay: GAMMA, authors: ["carol", "grace"] },
      { relay: DELTA, authors: ["frank"] },
    ]);
    expect(minimalCover(erin)).toEqual([BETA, GAMMA]);
    expect(minimalCover([])).toEqual([]);
  });

  test("replies go to my write relays and their read relays", () => {
    expect(replyTargets("erin", "carol")).toEqual([ALPHA, GAMMA]);
    expect(replyTargets("grace", "bob")).toEqual([BETA, GAMMA]);
  });

  test("stepAt clamps", () => {
    expect(stepAt("outbox", -3)).toBe("start");
    expect(stepAt("outbox", 99)).toBe("notes");
    expect(stepAt("reply", 1.7)).toBe("lookup");
    expect(STEPS.single).toEqual(["start", "follows", "subscribe", "notes"]);
  });
});

describe("outboxScene", () => {
  test("outbox mode walks from follow list to everyone's notes", () => {
    const start = outboxScene(input(), 0, names);
    expect(start.narration.key).toBe("start");
    expect(start.people.every((p) => p.state === "idle")).toBe(true);
    expect(start.edges).toEqual([]);
    expect(start.contacted).toEqual([]);

    const follows = outboxScene(input(), 1, names);
    expect(follows.narration).toMatchObject({
      key: "follows",
      params: { name: "Erin", relay: "Alpha", list: "Alice, Carol, Frank, Grace" },
    });
    expect(follows.packets.map((p) => p.type)).toEqual(["req", "event"]);
    expect(follows.relays.find((r) => r.url === INDEXER)?.state).toBe("lookup");
    expect(follows.people.every((p) => p.state === "known")).toBe(true);

    const lists = outboxScene(input(), 2, names);
    expect(lists.edges.filter((e) => e.kind === "write")).toHaveLength(7);
    expect(lists.narration.key).toBe("relayLists");

    const plan = outboxScene(input(), 3, names);
    expect(plan.narration.params["count"]).toBe("4");
    expect(plan.narration.params["minimal"]).toBe("2");
    expect(plan.relays.map((r) => r.state)).toEqual(["planned", "planned", "planned", "planned"]);
    expect(plan.relays[3]?.authors).toEqual(["frank"]);
    expect(plan.packets).toEqual([]);

    const sub = outboxScene(input(), 4, names);
    expect(sub.narration.key).toBe("subscribe");
    expect(sub.edges.filter((e) => e.kind === "link")).toHaveLength(4);
    expect(sub.packets.every((p) => p.from === "app" && p.type === "req")).toBe(true);
    expect(sub.contacted).toHaveLength(4);

    const notes = outboxScene(input(), 5, names);
    expect(notes.narration.key).toBe("notesAll");
    expect(notes.reached).toEqual(["alice", "carol", "frank", "grace"]);
    expect(notes.people.every((p) => p.state === "reached")).toBe(true);
    expect(notes.packets.every((p) => p.to === "app" && p.type === "event")).toBe(true);
  });

  test("one relay: people who don't write there go missing", () => {
    const single = input({ mode: "single" });
    const f = outboxScene(single, 1, names);
    expect(f.narration.key).toBe("singleFollows");
    expect(f.edges).toEqual([]);
    const sub = outboxScene(single, 2, names);
    expect(sub.narration.key).toBe("singleSubscribe");
    expect(sub.relays[0]?.authors).toEqual(["alice", "carol", "frank", "grace"]);
    expect(sub.relays[1]?.state).toBe("idle");
    const notes = outboxScene(single, 3, names);
    expect(notes.narration).toMatchObject({
      key: "notesSome",
      params: { reached: "2", total: "4", missed: "Frank, Grace", relay: "Alpha" },
    });
    expect(notes.people.map((p) => p.state)).toEqual(["reached", "reached", "missed", "missed"]);
    expect(notes.edges.some((e) => e.kind === "write")).toBe(true);
    expect(notes.packets).toHaveLength(1);
  });

  test("one relay nobody uses delivers nothing", () => {
    const notes = outboxScene(
      input({ viewer: "grace", mode: "single", singleRelay: DELTA }),
      3,
      names,
    );
    expect(notes.reached).toEqual([]);
    expect(notes.packets).toEqual([]);
    const lucky = outboxScene(
      input({ viewer: "grace", mode: "single", singleRelay: GAMMA }),
      3,
      names,
    );
    expect(lucky.narration.key).toBe("notesSome");
    const all = outboxScene(
      input({ viewer: "dave", mode: "single", singleRelay: ALPHA }),
      3,
      names,
    );
    // Dave follows Alice, Bob, Frank: Bob writes only to Beta, Frank to Beta and Delta.
    expect(all.missed).toEqual(["bob", "frank"]);
  });

  test("everyone on the relay → notesAll even in single mode", () => {
    const s = outboxScene(input({ viewer: "frank", mode: "single", singleRelay: ALPHA }), 3, names);
    expect(s.missed).toEqual([]);
    expect(s.narration.key).toBe("notesAll");
  });

  test("reply mode finds the inbox, then publishes", () => {
    const reply = input({ mode: "reply" });
    const start = outboxScene(reply, 0, names);
    expect(start.narration.key).toBe("start");
    expect(start.people.every((p) => p.state === "idle")).toBe(true);
    expect(start.edges).toEqual([]);
    const lookup = outboxScene(reply, 1, names);
    expect(lookup.narration.key).toBe("lookup");
    expect(lookup.people.find((p) => p.id === "carol")?.state).toBe("target");
    expect(lookup.edges).toEqual([
      { id: `read-carol-${GAMMA}`, from: "carol", to: GAMMA, kind: "read" },
    ]);
    expect(lookup.contacted).toEqual([INDEXER]);
    expect(lookup.relays[0]?.state).toBe("lookup");
    const pub = outboxScene(reply, 2, names);
    expect(pub.narration).toMatchObject({
      key: "publish",
      params: { recipient: "Carol", relays: "Alpha, Gamma" },
    });
    expect(pub.relays.map((r) => r.state)).toEqual(["publish", "idle", "publish", "idle"]);
    expect(pub.packets.map((p) => p.to)).toEqual([ALPHA, GAMMA]);
    expect(pub.contacted).toEqual([ALPHA, GAMMA]);
  });
});

describe("wire frames", () => {
  test("outbox frames are valid client messages, one REQ per relay", () => {
    expect(framesUpTo(input(), 0, "")).toEqual([]);
    const frames = framesUpTo(input(), 5, "");
    expect(frames).toHaveLength(2 + 4);
    for (const f of frames) {
      const [comment, json = ""] = f.split("\n");
      expect(comment).toStartWith("// → ");
      expect(parseClientMessage(json).ok).toBe(true);
    }
    expect(frames[2]).toContain('"feed-alpha"');
    expect(frames[2]).toContain(getPersona("alice").pubkey);
    expect(frames[2]).not.toContain(getPersona("frank").pubkey);
  });

  test("single-relay frames ask one relay for everyone", () => {
    const frames = framesUpTo(input({ mode: "single", singleRelay: BETA }), 3, "");
    expect(frames).toHaveLength(2);
    expect(frames[0]).toStartWith("// → Beta");
    expect(frames[1]).toContain('"feed-beta"');
  });

  test("reply frames carry a real, verifiable signed event", () => {
    const frames = framesUpTo(input({ mode: "reply" }), 2, "Love this, Carol!");
    expect(frames).toHaveLength(1 + 2);
    expect(frames[0]).toContain('"inbox"');
    const json = frames[1]?.split("\n")[1] ?? "";
    const msg = parseClientMessage(json);
    expect(msg.ok && msg.value[0] === "EVENT").toBe(true);
    if (msg.ok && msg.value[0] === "EVENT") {
      expect(verifyEvent(msg.value[1]).ok).toBe(true);
      expect(msg.value[1].content).toBe("Love this, Carol!");
    }
  });

  test("replyEvent tags root + p (and only p when there is nothing to reply to)", () => {
    const r = replyEvent("erin", "carol", "hi");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [e, p] = r.value.event.tags;
    expect(e?.[0]).toBe("e");
    expect(e?.[3]).toBe("root");
    expect(e?.[4]).toBe(getPersona("carol").pubkey);
    expect(p).toEqual(["p", getPersona("carol").pubkey]);
  });
});

describe("replaceable follow lists", () => {
  test("followTag follows NIP-02", () => {
    expect(followTag("bob")).toEqual(["p", getPersona("bob").pubkey, BETA, "bob"]);
  });

  test("buildFollowList signs a real kind 3", () => {
    const e = buildFollowList("grace", ["alice", "bob"], 100);
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.value.kind).toBe(3);
    expect(e.value.content).toBe("");
    expect(verifyEvent(e.value).ok).toBe(true);
    expect(followsInEvent(e.value)).toEqual(["alice", "bob"]);
  });

  test("newest wins; ties keep the lowest id", () => {
    const a = buildFollowList("grace", ["alice"], 100);
    const b = buildFollowList("grace", ["bob"], 100);
    const c = buildFollowList("grace", ["carol"], 200);
    if (!a.ok || !b.ok || !c.ok) throw new Error("signing failed");
    expect(newestReplaceable([])).toBeUndefined();
    expect(newestReplaceable([a.value, c.value])).toBe(c.value);
    expect(newestReplaceable([c.value, a.value])).toBe(c.value);
    const lowest = a.value.id < b.value.id ? a.value : b.value;
    expect(newestReplaceable([a.value, b.value])).toBe(lowest);
    expect(newestReplaceable([b.value, a.value])).toBe(lowest);
  });

  test("followsInEvent ignores unknown pubkeys and non-p tags", () => {
    expect(followsInEvent(undefined)).toEqual([]);
    const e = buildFollowList("grace", ["alice"], 1);
    if (!e.ok) throw new Error("signing failed");
    const odd = {
      ...e.value,
      tags: [...e.value.tags, ["p", "ab".repeat(32)], ["t", "x"], ["p"]] as const,
    };
    expect(followsInEvent(odd)).toEqual(["alice"]);
  });

  test("the tablet trap: a stale list overwrites a newer one", () => {
    const phone: PersonaId[] = ["alice", "bob", "erin", "dave"];
    const one = publish([], "phone", phone);
    if (!one.ok) throw new Error("publish failed");
    expect(relayKeeps(one.value)?.version).toBe(1);
    const two = publish(one.value, "tablet", TABLET_FOLLOWS);
    if (!two.ok) throw new Error("publish failed");
    const kept = relayKeeps(two.value);
    expect(kept?.device).toBe("tablet");
    expect(followsInEvent(kept?.event)).toEqual(["alice"]);
    expect(lostFollows(phone, followsInEvent(kept?.event))).toEqual(["bob", "erin", "dave"]);
    expect(relayKeeps([])).toBeUndefined();
  });

  test("toggle, owner and candidates", () => {
    expect(toggle(["alice"], "bob")).toEqual(["alice", "bob"]);
    expect(toggle(["alice", "bob"], "alice")).toEqual(["bob"]);
    expect(OWNER).toBe("grace");
    expect(CANDIDATES).not.toContain("grace");
    expect(CANDIDATES).toHaveLength(6);
  });
});
