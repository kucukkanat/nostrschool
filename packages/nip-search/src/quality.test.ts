/**
 * Search quality with the REAL model and committed embeddings: natural-language queries → the
 * NIP a person means, judged on the top 3 hybrid results.
 *
 * - CORE: every query must hit. These are the canonical intents (several also have search hints
 *   in aliases.ts, which is the point of hints).
 * - TUNED: the rest of the set DEFAULT_TUNING was tuned on; must stay ≥ 95%.
 * - HELD_OUT: written after tuning and never used to tune or to write hints, so it measures how
 *   well search generalises; must stay ≥ 85% (28/30 when written). When a hint is added for a
 *   held-out miss, that query moves to TUNED and a fresh, untested query replaces it.
 * - ES: Spanish queries on /es/nips (keyword side: Spanish titles, summaries, hints; the model is
 *   English, so its weak matches must not bury them); must stay ≥ 90%.
 * - IDENTIFIERS: a pasted field/tag name must put the NIP that DEFINES it FIRST (top 1), above
 *   NIPs that only mention it (definitions.ts); every case must hit.
 * - NONSENSE: gibberish must return nothing, so the UI shows "no results".
 */
import { beforeAll, describe, expect, test } from "bun:test";
import { createHybridSearch } from "./search.ts";
import { LISTINGS, localBackend } from "./test-support.ts";
import type { NipSearch } from "./types.ts";

type Case = readonly [query: string, expected: readonly string[]];

const CORE: readonly Case[] = [
  ["send sats to a post", ["57"]],
  ["private DMs", ["17", "44", "59", "04"]],
  ["login with extension", ["07"]],
  ["relay information", ["11"]],
  ["delete my note", ["09"]],
  ["long articles", ["23"]],
  ["verify my domain name", ["05"]],
  ["react to a post with an emoji", ["25"]],
  ["repost someone else's note", ["18"]],
  ["follow list of people I follow", ["02"]],
  ["remote signer bunker", ["46"]],
  ["connect my lightning wallet to the app", ["47"]],
  ["upload a file or image", ["96", "B7", "94"]],
  ["calendar events and meetings", ["52"]],
  ["badges for profile", ["58"]],
  ["mnemonic seed words to derive keys", ["06"]],
  ["password protected private key", ["49"]],
  ["authenticate to a relay", ["42"]],
  ["report spam or abuse", ["56"]],
  ["set expiration time for an event", ["40"]],
  ["HTTP authorization header", ["98"]],
  ["polls and voting", ["88"]],
];

const TUNED: readonly Case[] = [
  ["encrypt a message to someone", ["44", "04"]],
  ["mute a user", ["51"]],
  ["live streaming video", ["53"]],
  ["group chat", ["29", "28"]],
  ["proof of work mining event id", ["13"]],
  ["bech32 npub encoding", ["19"]],
  ["full text search on relays", ["50"]],
  ["highlight a quote from a web page", ["84"]],
  ["which relays does a user write to", ["65"]],
  ["content warning sensitive", ["36"]],
  ["count events", ["45"]],
  ["sync events between relays efficiently", ["77"]],
  ["marketplace sell products", ["15", "99"]],
  ["wiki articles", ["54"]],
  ["user status music playing", ["38"]],
  ["comment on a website or url", ["22"]],
  ["threads and replies to a note", ["10"]],
  ["edit my profile name and picture", ["01", "24"]],
  // Hinted after review (were misses): developer phrasings and newcomer words.
  ["like a note", ["25"]],
  ["attach pictures to a note", ["92", "68"]],
  ["nsfw", ["36"]],
  ["hashtags", ["24"]],
  ["timestamp proof bitcoin", ["03"]],
  ["what is my public key and secret key format", ["19"]],
  ["nostrconnect:// uri", ["46"]],
  ["bunker://", ["46"]],
  ["publish a website on nostr", ["5A"]],
  ["nprofile nevent naddr TLV", ["19"]],
  // Upper-case wire message types pin the NIP defining them.
  ["CLOSED message", ["01"]],
  ["OK message rejected reason prefix", ["01"]],
];

const HELD_OUT: readonly Case[] = [
  ["tip a creator with bitcoin", ["57"]],
  ["how do I sign events with a browser plugin", ["07"]],
  ["end to end encrypted chat", ["17", "EE", "44"]],
  ["find out what a relay supports", ["11"]],
  ["remove a post I published", ["09"]],
  ["blog post format", ["23"]],
  ["nostr address like name@example.com", ["05"]],
  ["recover my account from twelve words", ["06"]],
  ["share someone's post to my followers", ["18"]],
  ["who I follow", ["02"]],
  ["keep my private key on another device", ["46", "55"]],
  ["pay a lightning invoice from an app", ["47"]],
  ["see who reposted my note", ["18"]],
  ["block someone", ["51"]],
  ["schedule something at a date and time", ["52"]],
  ["fundraising goal", ["75"]],
  ["chess game", ["64"]],
  ["podcast episodes", ["F4"]],
  ["code collaboration with git", ["34"]],
  ["label or classify content", ["32"]],
  ["ask relays to forget everything about me", ["62"]],
  ["link my twitter account to my profile", ["39"]],
  ["voice notes", ["A0"]],
  ["torrent sharing", ["35"]],
  ["bluetooth", ["BE"]],
  ["pay for AI computation jobs", ["90"]],
  ["ecash tokens", ["60", "61", "87"]],
  ["posts bridged from ActivityPub", ["48"]],
  ["recommend an app to open an event kind", ["89"]],
  ["only the author may publish this event", ["70"]],
];

const ES: readonly Case[] = [
  ["encuestas", ["88"]],
  ["contenido sensible", ["36"]],
  ["información del relé", ["11"]],
  ["informacion del rele", ["11"]],
  ["cifrado de mensajes", ["44", "04"]],
  ["iniciar sesión con extensión del navegador", ["07"]],
  ["denunciar contenido", ["56"]],
  ["borrar mi nota", ["09"]],
  ["me gusta", ["25"]],
  ["subir una imagen", ["96", "B7"]],
  ["mensajes privados", ["17", "04", "44"]],
  ["seguir a personas", ["02"]],
  ["reacciones", ["25"]],
  ["zaps", ["57"]],
];

const IDENTIFIERS: readonly Case[] = [
  ["supported_nips", ["11"]],
  ["max_message_length", ["11"]],
  ["auth_required", ["11"]],
  ["payments_url", ["11"]],
  ["lud16", ["57"]],
  ["lud06", ["57"]],
  ["relays field of nostr.json", ["05"]],
  ["nostr.json", ["05"]],
  ['"d" tag addressable', ["01"]],
  ["created_at", ["01"]],
];

const NONSENSE: readonly string[] = ["zzqxw nonsense", "qwrtp", "asdfgh", "kjh kjh"];

let search: NipSearch;
let searchEs: NipSearch;
beforeAll(async () => {
  const backend = localBackend();
  search = createHybridSearch({ listings: LISTINGS, semantic: backend });
  searchEs = createHybridSearch({ listings: LISTINGS, semantic: backend, locale: "es" });
  expect((await search.warmup()).ok).toBe(true);
  expect((await searchEs.warmup()).ok).toBe(true);
}, 60_000);

const top3 = async (query: string, engine = search): Promise<readonly string[]> => {
  const r = await engine.search({ text: query, limit: 3 });
  if (!r.ok) throw new Error(r.error.message);
  expect(r.value.mode).toBe("hybrid");
  return r.value.hits.map((h) => h.id);
};

const misses = async (cases: readonly Case[], engine = search): Promise<readonly string[]> => {
  const out: string[] = [];
  for (const [query, expected] of cases) {
    const got = await top3(query, engine);
    if (!expected.some((id) => got.includes(id)))
      out.push(`"${query}" → ${got.join(" ")} (want ${expected.join("/")})`);
  }
  return out;
};

describe("search quality (top 3, real model)", () => {
  test("the sets are big enough to mean something", () => {
    expect(CORE.length).toBeGreaterThanOrEqual(20);
    expect(CORE.length + TUNED.length + HELD_OUT.length).toBeGreaterThanOrEqual(60);
  });

  test.each(CORE)("%p → NIP %p", async (query, expected) => {
    const got = await top3(query);
    expect(expected.some((id) => got.includes(id))).toBe(true);
  });

  test("tuned set ≥ 95%", async () => {
    const missed = await misses(TUNED);
    expect(missed.length / TUNED.length, missed.join("\n")).toBeLessThanOrEqual(0.05);
  });

  test("held-out set ≥ 85%", async () => {
    const missed = await misses(HELD_OUT);
    expect(missed.length / HELD_OUT.length, missed.join("\n")).toBeLessThanOrEqual(0.15);
  });

  test("Spanish set ≥ 90%", async () => {
    const missed = await misses(ES, searchEs);
    expect(missed.length / ES.length, missed.join("\n")).toBeLessThanOrEqual(0.1);
  });

  test.each(IDENTIFIERS)("%p → NIP %p first (defines it)", async (query, [expected]) => {
    const r = await search.search({ text: query, limit: 1 });
    expect(r.ok && r.value.hits.map((h) => h.id)).toEqual([expected ?? ""]);
  });

  test.each([...NONSENSE])("%p → no results", async (query) => {
    const r = await search.search({ text: query });
    expect(r.ok && r.value.hits).toEqual([]);
  });
});
