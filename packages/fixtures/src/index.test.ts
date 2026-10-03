import { describe, expect, test } from "bun:test";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import type { NostrEvent, UnsignedEvent } from "@nostrschool/protocol";
import { decode } from "nostr-tools/nip19";
import { getEventHash, verifyEvent } from "nostr-tools/pure";
import raw from "./data/events.json" with { type: "json" };
import {
  eventById,
  eventsByAuthor,
  eventsByKind,
  eventsOnRelay,
  FIXTURE_EVENTS,
  FIXTURE_NOW,
  followGraph,
  getPersona,
  getRelay,
  giftWraps,
  isPersonaId,
  PERSONA_IDS,
  PERSONAS,
  personaByPubkey,
  RELAYS,
  relayListFor,
  relaysForEvent,
  ZAP_SERVICES,
  zaps,
} from "./index.ts";

// Fresh copies: nostr-tools caches "verified" on the object, and we want real verification.
const nt = (e: NostrEvent) => ({ ...e, tags: e.tags.map((t) => [...t]) });
const tagValues = (e: UnsignedEvent, name: string): string[] =>
  e.tags.flatMap((t) => (t[0] === name && t[1] !== undefined ? [t[1]] : []));

describe("cast and clock", () => {
  test("are fixed", () => {
    expect(PERSONA_IDS).toEqual(["alice", "bob", "carol", "dave", "erin", "frank", "grace"]);
    expect(FIXTURE_NOW).toBe(1735689600);
    expect(raw.fixtureNow).toBe(FIXTURE_NOW);
  });

  test("personas derive from sha256(nostrschool:persona:<id>)", () => {
    for (const p of PERSONAS) {
      const sk = sha256(utf8ToBytes(`nostrschool:persona:${p.id}`));
      expect(p.secretKeyHex).toBe(bytesToHex(sk));
      expect(p.secretKey).toEqual(sk);
      expect(decode(p.npub)).toEqual({ type: "npub", data: p.pubkey });
      expect(decode(p.nsec)).toEqual({ type: "nsec", data: sk });
      expect(p.name).toBe(p.id);
      expect(p.initials).toBe(p.displayName.slice(0, 1));
      expect(p.avatar.startsWith("data:image/svg+xml,")).toBe(true);
      expect(decodeURIComponent(p.avatar)).toContain(`>${p.initials}</text>`);
      expect(p.lud16).toMatch(/^[a-z]+@wallet\.(alpha|beta)\.example$/);
      expect(p.nip05).toBe(`${p.id}@${p.lud16.split("@wallet.")[1]}`);
      expect(getPersona(p.id)).toBe(p);
      expect(isPersonaId(p.id)).toBe(true);
      expect(personaByPubkey(p.pubkey)).toBe(p);
    }
    expect(isPersonaId("mallory")).toBe(false);
    expect(new Set(PERSONAS.map((p) => p.pubkey)).size).toBe(PERSONAS.length);
    expect(personaByPubkey("00".repeat(32))).toBeUndefined();
  });

  test("relays", () => {
    expect(RELAYS.map((r) => r.url)).toEqual([
      "wss://relay.alpha.example",
      "wss://relay.beta.example",
      "wss://relay.gamma.example",
      "wss://relay.delta.example",
    ]);
    expect(getRelay("wss://relay.delta.example")?.paid).toBe(true);
    expect(getRelay("wss://nope.example")).toBeUndefined();
  });
});

describe("every committed event", () => {
  test("has the right id and a valid signature (nostr-tools)", () => {
    expect(FIXTURE_EVENTS.length).toBe(raw.events.length);
    for (const e of FIXTURE_EVENTS) {
      expect(getEventHash(nt(e))).toBe(e.id);
      expect(verifyEvent(nt(e))).toBe(true);
    }
  });

  test("a tampered copy fails verification", () => {
    const [first] = FIXTURE_EVENTS;
    if (first === undefined) throw new Error("no events");
    expect(verifyEvent({ ...nt(first), content: `${first.content}!` })).toBe(false);
  });

  test("covers the promised kinds and is newest first with unique ids", () => {
    const kinds = new Set(FIXTURE_EVENTS.map((e) => e.kind));
    for (const k of [0, 1, 3, 5, 6, 7, 1059, 9734, 9735, 10002, 30023]) expect(kinds).toContain(k);
    FIXTURE_EVENTS.slice(1).forEach((e, i) => {
      const prev = FIXTURE_EVENTS[i];
      expect(prev !== undefined && prev.created_at >= e.created_at).toBe(true);
    });
    expect(new Set(FIXTURE_EVENTS.map((e) => e.id)).size).toBe(FIXTURE_EVENTS.length);
    expect(FIXTURE_EVENTS.every((e) => e.created_at <= FIXTURE_NOW)).toBe(true);
  });
});

describe("accessors", () => {
  test("eventsByKind takes one kind or several", () => {
    expect(eventsByKind(0).every((e) => e.kind === 0)).toBe(true);
    expect(eventsByKind(0)).toHaveLength(8); // 7 personas + Alice's outdated profile
    expect(eventsByKind([6, 7]).length).toBe(eventsByKind(6).length + eventsByKind(7).length);
    expect(eventsByKind(424242)).toEqual([]);
  });

  test("eventsByAuthor accepts a persona id or a pubkey", () => {
    const alice = getPersona("alice");
    expect(eventsByAuthor("alice")).toEqual(eventsByAuthor(alice.pubkey));
    expect(eventsByAuthor("alice").every((e) => e.pubkey === alice.pubkey)).toBe(true);
    expect(eventsByAuthor("ff".repeat(32))).toEqual([]);
  });

  test("eventById", () => {
    const [first] = FIXTURE_EVENTS;
    expect(first && eventById(first.id)).toBe(first);
    expect(eventById("00".repeat(32))).toBeUndefined();
  });

  test("followGraph uses each persona's latest kind 3", () => {
    const g = followGraph();
    expect(g.nodes.map((n) => n.personaId)).toEqual([...PERSONA_IDS]);
    expect(g.edges).toHaveLength(25);
    const follows = (id: (typeof PERSONA_IDS)[number]) =>
      g.edges.filter((e) => e.from === getPersona(id).pubkey).map((e) => personaByPubkey(e.to)?.id);
    expect(follows("grace")).toEqual(["alice", "bob", "erin"]); // not the older ["alice"]
    expect(follows("alice")).toEqual(["bob", "carol", "dave", "erin", "frank"]);
    // Everyone is followed by someone, and nobody follows themselves.
    for (const p of PERSONAS) expect(g.edges.some((e) => e.to === p.pubkey)).toBe(true);
    expect(g.edges.some((e) => e.from === e.to)).toBe(false);
  });

  test("relayListFor mirrors kind 10002 and persona.relays", () => {
    for (const p of PERSONAS) {
      expect(relayListFor(p.id)).toEqual(p.relays);
      expect(relayListFor(p.pubkey)).toEqual(p.relays);
    }
    expect(relayListFor("ab".repeat(32))).toEqual([]);
  });

  test("placement: outbox, inbox, and the paid relay", () => {
    for (const e of FIXTURE_EVENTS) {
      for (const url of relaysForEvent(e.id)) {
        expect(getRelay(url)).toBeDefined();
        expect(eventsOnRelay(url)).toContain(e);
      }
    }
    const author = personaByPubkey;
    // Normal events always reach every write relay of their author.
    for (const e of eventsByKind([0, 1, 3, 5, 6, 7, 10002, 30023])) {
      const p = author(e.pubkey);
      for (const r of p?.relays ?? []) if (r.write) expect(relaysForEvent(e.id)).toContain(r.url);
    }
    // Only members (who list Delta as a write relay) end up on the paid relay.
    const members = PERSONAS.filter((p) => p.relays.some((r) => r.url.includes("delta")));
    for (const e of eventsOnRelay("wss://relay.delta.example")) {
      expect(members.map((m) => m.pubkey)).toContain(e.pubkey);
    }
    // Bob's reply to Alice lands in Alice's inbox even though Bob never writes to Alpha.
    const bobReply = eventsByAuthor("bob").find((e) => e.kind === 1 && tagValues(e, "e").length);
    expect(bobReply && relaysForEvent(bobReply.id)).toContain("wss://relay.alpha.example");
    // Gamma holds things nobody else has: the outbox model must find it.
    expect(eventsOnRelay("wss://relay.gamma.example").length).toBeGreaterThan(0);
    expect(eventsOnRelay("wss://nope.example")).toEqual([]);
    expect(relaysForEvent("00".repeat(32))).toEqual([]);
    // Zap requests are never published to a relay.
    for (const e of eventsByKind(9734)) expect(relaysForEvent(e.id)).toEqual([]);
  });
});

describe("story", () => {
  const notes = eventsByKind(1);

  test("threads use NIP-10 markers pointing at real events", () => {
    const replies = notes.filter((e) => e.tags.some((t) => t[0] === "e"));
    expect(replies.length).toBeGreaterThanOrEqual(6);
    for (const r of replies) {
      const eTags = r.tags.filter((t) => t[0] === "e");
      expect(eTags.some((t) => t[3] === "root")).toBe(true);
      for (const t of eTags) {
        const target = eventById(t[1] ?? "");
        expect(target).toBeDefined();
        expect(t[4]).toBe(target?.pubkey);
        expect(tagValues(r, "p").length).toBeGreaterThan(0);
      }
    }
    expect(replies.some((r) => r.tags.some((t) => t[3] === "reply"))).toBe(true);
  });

  test("hashtags appear as lowercase t tags", () => {
    const tagged = notes.filter((e) => /#[a-z]/.test(e.content));
    expect(tagged.length).toBeGreaterThan(4);
    for (const e of tagged) {
      for (const [, word] of e.content.matchAll(/#([a-z]+)/g)) {
        expect(tagValues(e, "t")).toContain(word ?? "");
      }
    }
  });

  test("nostr:npub mentions have matching p tags", () => {
    const mentioning = notes.filter((e) => e.content.includes("nostr:npub1"));
    expect(mentioning.length).toBeGreaterThanOrEqual(3);
    for (const e of mentioning) {
      for (const [, npub] of e.content.matchAll(/nostr:(npub1[a-z0-9]+)/g)) {
        const d = decode(npub ?? "");
        expect(d.type).toBe("npub");
        expect(tagValues(e, "p")).toContain(d.data as string);
      }
    }
  });

  test("deletion, reposts, reactions and articles are well-formed", () => {
    const [deletion] = eventsByKind(5);
    const deleted = eventById(deletion ? (tagValues(deletion, "e")[0] ?? "") : "");
    expect(deleted?.pubkey).toBe(deletion?.pubkey); // you can only delete your own events
    for (const r of eventsByKind(6)) {
      const original = JSON.parse(r.content);
      expect(original.id).toBe(tagValues(r, "e")[0]);
      expect(eventById(original.id)).toEqual(original);
    }
    for (const r of eventsByKind(7)) {
      const target = eventById(tagValues(r, "e")[0] ?? "");
      expect(tagValues(r, "p")).toEqual([target?.pubkey ?? ""]);
      expect(tagValues(r, "k")).toEqual([String(target?.kind)]);
    }
    const frank = eventsByKind(30023).filter((e) => e.pubkey === getPersona("frank").pubkey);
    expect(frank.map((e) => tagValues(e, "d")[0])).toEqual([
      "protocols-not-platforms",
      "protocols-not-platforms",
    ]);
    expect(frank[0]?.content.length).toBeGreaterThan(frank[1]?.content.length ?? 0);
  });
});

describe("giftWraps (NIP-17)", () => {
  const dms = giftWraps();

  test("open into seal + rumor with every layer intact", () => {
    expect(dms.map((d) => `${d.sender}->${d.recipient}`)).toEqual([
      "alice->bob",
      "bob->alice",
      "grace->alice",
      "carol->erin",
    ]);
    for (const d of dms) {
      expect(d.wrap.kind).toBe(1059);
      expect(personaByPubkey(d.wrap.pubkey)).toBeUndefined(); // ephemeral key
      expect(tagValues(d.wrap, "p")).toEqual([getPersona(d.recipient).pubkey]);
      expect(d.seal.kind).toBe(13);
      expect(d.seal.tags).toEqual([]);
      expect(d.seal.pubkey).toBe(getPersona(d.sender).pubkey);
      expect(verifyEvent(nt(d.seal))).toBe(true);
      expect(d.rumor.kind).toBe(14);
      expect("sig" in d.rumor).toBe(false);
      expect(getEventHash(nt({ ...d.rumor, sig: "" }))).toBe(d.rumor.id);
      expect(tagValues(d.rumor, "p")).toEqual([getPersona(d.recipient).pubkey]);
      // Seal/wrap timestamps are backdated, never in the future of the message.
      expect(d.wrap.created_at).toBeLessThanOrEqual(d.rumor.created_at);
      expect(relaysForEvent(d.wrap.id)).toEqual(
        getPersona(d.recipient)
          .relays.filter((r) => r.read)
          .map((r) => r.url),
      );
    }
    expect(giftWraps()).toBe(dms); // decrypted once, then cached
  });

  test("bob's answer replies to alice's rumor", () => {
    const [first, second] = dms;
    expect(second?.rumor.tags).toContainEqual(["e", first?.rumor.id ?? "", "", "reply"]);
  });
});

describe("zaps (NIP-57)", () => {
  test("receipts embed the signed request and are signed by the wallet", () => {
    const all = zaps();
    expect(all.map((z) => [z.sender, z.recipient, z.amountMsats])).toEqual([
      ["alice", "erin", 2_100_000],
      ["grace", "alice", 21_000],
      ["bob", "dave", 1_000_000],
    ]);
    const walletKeys = ZAP_SERVICES.map((s) => s.pubkey);
    for (const z of all) {
      expect(z.request.kind).toBe(9734);
      expect(eventById(z.request.id)).toEqual(z.request);
      expect(verifyEvent(nt(z.request))).toBe(true);
      expect(walletKeys).toContain(z.receipt.pubkey);
      expect(z.bolt11).toBe(tagValues(z.receipt, "bolt11")[0] ?? "");
      expect(z.bolt11.startsWith(`lnbc${z.amountMsats / 100}n1p`)).toBe(true);
      expect(tagValues(z.receipt, "P")).toEqual([z.request.pubkey]);
      expect(tagValues(z.receipt, "preimage")[0]).toMatch(/^[0-9a-f]{64}$/);
      const relays = tagValues(z.request, "relays");
      expect(z.request.tags.find((t) => t[0] === "relays")?.slice(1)).toEqual(
        relaysForEvent(z.receipt.id) as string[],
      );
      expect(relays.length).toBeGreaterThan(0);
    }
  });
});
