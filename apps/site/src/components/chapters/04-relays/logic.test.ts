import { describe, expect, test } from "bun:test";
import { getPersona } from "@nostrschool/fixtures";
import { getDictionary } from "@nostrschool/i18n";
import {
  parseClientMessage,
  parseRelayMessage,
  serializeMessage,
  verifyEvent,
} from "@nostrschool/protocol";
import {
  classifyFrame,
  LIVE_FILTER,
  logFrame,
  MAX_FRAME_CHARS,
  MAX_LOG,
  relayHost,
  truncate,
} from "./live.ts";
import {
  aliveCount,
  INITIAL_CARDS,
  nextVictim,
  publishedCount,
  survivedOutage,
  toggle,
  verdict,
} from "./redundancy.ts";
import {
  AUTH_CHALLENGE,
  AUTH_EVENT,
  EMPTY_NOTEBOOK,
  type Frame,
  firstStepOf,
  frameLabel,
  LEGEND_VERBS,
  lanesFor,
  messagesFor,
  notebookAt,
  RELAY_URLS,
  SCENARIO_IDS,
  SCRIPTS,
} from "./wire.ts";

const t = getDictionary("en").chapters.ch04;

describe("scripts", () => {
  test("every frame is valid NIP-01 in its direction (round-trips through the real parsers)", () => {
    for (const id of SCENARIO_IDS)
      for (const step of SCRIPTS[id]) {
        const raw = serializeMessage(step.frame);
        const parsed = step.out ? parseClientMessage(raw) : parseRelayMessage(raw);
        expect(parsed.ok).toBe(true);
      }
  });

  test("every carried event really verifies, including the NIP-42 auth event", () => {
    for (const id of SCENARIO_IDS)
      for (const { frame } of SCRIPTS[id]) {
        const event = frame[0] === "EVENT" || frame[0] === "AUTH" ? frame.at(-1) : undefined;
        if (typeof event === "object" && event !== null && "sig" in event)
          expect(verifyEvent(event).ok).toBe(true);
      }
  });

  test("auth event follows NIP-42: kind 22242, relay + challenge tags, signed by Alice", () => {
    expect(AUTH_EVENT.kind).toBe(22242);
    expect(AUTH_EVENT.pubkey).toBe(getPersona("alice").pubkey);
    expect(AUTH_EVENT.tags).toEqual([
      ["relay", RELAY_URLS.delta],
      ["challenge", AUTH_CHALLENGE],
    ]);
  });

  test("OK/CLOSED reasons use standard machine-readable prefixes", () => {
    const prefixes =
      /^(duplicate|pow|blocked|rate-limited|invalid|restricted|mute|error|auth-required):/;
    for (const id of SCENARIO_IDS)
      for (const { frame } of SCRIPTS[id]) {
        const reason = frame[0] === "OK" ? frame[3] : frame[0] === "CLOSED" ? frame[2] : undefined;
        if (reason !== undefined && reason !== "") expect(reason).toMatch(prefixes);
      }
  });

  test("every step id has an English narration and becomes a diagram message", () => {
    for (const id of SCENARIO_IDS) {
      const messages = messagesFor(id, "en");
      const steps: Readonly<Record<string, string>> = t.theater.scenarios[id].steps;
      expect(messages.map((m) => m.id)).toEqual(Object.keys(steps));
      for (const m of messages) {
        expect(m.narration).toBe(steps[m.id]);
        expect(m.from === "client" || m.to === "client").toBe(true);
      }
    }
  });

  test("lanes: client first, relays labelled from i18n", () => {
    expect(lanesFor("read", "en").map((l) => l.label)).toEqual([
      t.lanes.client,
      t.lanes.alpha,
      t.lanes.beta,
      t.lanes.gamma,
    ]);
    expect(lanesFor("auth", "es").map((l) => l.kind)).toEqual(["client", "relay"]);
  });
});

describe("frameLabel", () => {
  const ev = AUTH_EVENT;
  const cases: readonly [Frame, string][] = [
    [["REQ", "feed", {}], 'REQ "feed"'],
    [["CLOSE", "feed"], 'CLOSE "feed"'],
    [["CLOSED", "feed", "error: x"], 'CLOSED "feed"'],
    [["EOSE", "feed"], 'EOSE "feed"'],
    [["COUNT", "c", { count: 1 }], 'COUNT "c"'],
    [["EVENT", "feed", ev], 'EVENT "feed"'],
    [["EVENT", ev], "EVENT"],
    [["OK", ev.id, false, "pow: x"], "OK false"],
    [["NOTICE", "hi"], "NOTICE"],
    [["AUTH", "challenge"], "AUTH"],
  ];
  test.each(cases)("%j → %s", (frame, label) => expect(frameLabel(frame)).toBe(label));
});

describe("firstStepOf / legend", () => {
  test("finds the first packet of each verb, -1 when absent", () => {
    expect(firstStepOf("read", "REQ")).toBe(0);
    expect(firstStepOf("read", "EOSE")).toBe(6);
    expect(firstStepOf("read", "AUTH")).toBe(-1);
    expect(firstStepOf("auth", "AUTH")).toBe(1);
  });
  test("together the scenarios cover every verb in the legend", () => {
    for (const verb of LEGEND_VERBS)
      expect(SCENARIO_IDS.some((s) => firstStepOf(s, verb) >= 0)).toBe(true);
  });
});

describe("notebookAt", () => {
  test("before anything is sent, the notebook is empty", () => {
    expect(notebookAt(SCRIPTS.read, -1)).toEqual(EMPTY_NOTEBOOK);
  });
  test("read: subscriptions open, duplicates are counted once, CLOSED/CLOSE hang up", () => {
    expect(notebookAt(SCRIPTS.read, 2).open).toEqual(["alpha", "beta", "gamma"]);
    const afterDupe = notebookAt(SCRIPTS.read, 4);
    expect([afterDupe.received, afterDupe.unique]).toEqual([2, 1]);
    const end = notebookAt(SCRIPTS.read, SCRIPTS.read.length - 1);
    expect(end).toMatchObject({ open: [], received: 3, unique: 2 });
    expect(notebookAt(SCRIPTS.read, 8).open).toEqual(["alpha", "beta"]);
  });
  test("publish: OK true/false sort relays into accepted/rejected; a publish EVENT isn't 'received'", () => {
    const end = notebookAt(SCRIPTS.publish, 99);
    expect(end).toMatchObject({
      accepted: ["alpha", "beta"],
      rejected: ["gamma"],
      received: 0,
      authed: [],
    });
  });
  test("auth: the OK for the auth event logs us in; a failed auth doesn't", () => {
    expect(notebookAt(SCRIPTS.auth, 3).authed).toEqual([]);
    expect(notebookAt(SCRIPTS.auth, 4).authed).toEqual(["delta"]);
    expect(notebookAt(SCRIPTS.auth, 99)).toMatchObject({ open: [], unique: 1, accepted: [] });
    const refused = notebookAt(
      [
        {
          id: "x",
          relay: "delta",
          out: false,
          frame: ["OK", AUTH_EVENT.id, false, "restricted: no"],
        },
      ],
      0,
    );
    expect(refused).toEqual(EMPTY_NOTEBOOK);
  });
  test("re-opening an already open subscription doesn't list the relay twice", () => {
    const twice = notebookAt(
      [
        { id: "a", relay: "alpha", out: true, frame: ["REQ", "s", {}] },
        { id: "b", relay: "alpha", out: true, frame: ["REQ", "s", {}] },
      ],
      1,
    );
    expect(twice.open).toEqual(["alpha"]);
  });
});

describe("live helpers", () => {
  test("relayHost strips scheme and slash, keeps ports, passes junk through", () => {
    expect(relayHost("wss://nos.lol/")).toBe("nos.lol");
    expect(relayHost("ws://127.0.0.1:7447")).toBe("127.0.0.1:7447");
    expect(relayHost("not a url")).toBe("not a url");
  });
  test("classifyFrame uses the direction's parser; invalid frames are 'custom'", () => {
    expect(classifyFrame("out", '["REQ","s",{"kinds":[1]}]')).toBe("REQ");
    expect(classifyFrame("in", '["EOSE","s"]')).toBe("EOSE");
    expect(classifyFrame("in", '["REQ","s",{}]')).toBe("custom");
    expect(classifyFrame("in", "nope")).toBe("custom");
  });
  test("truncate keeps short frames whole and reports hidden characters", () => {
    expect(truncate("abc")).toEqual({ text: "abc", hidden: 0 });
    const long = "x".repeat(MAX_FRAME_CHARS + 5);
    expect(truncate(long)).toEqual({ text: "x".repeat(MAX_FRAME_CHARS), hidden: 5 });
  });
  test("logFrame appends classified entries and caps the log", () => {
    let log = logFrame(
      [],
      1,
      "out",
      "wss://a.example",
      serializeMessage(["REQ", "s", LIVE_FILTER]),
    );
    expect(log).toEqual([
      {
        key: 1,
        direction: "out",
        relay: "a.example",
        verb: "REQ",
        text: '["REQ","s",{"kinds":[1],"limit":3}]',
        hidden: 0,
      },
    ]);
    for (let i = 2; i <= MAX_LOG + 10; i += 1)
      log = logFrame(log, i, "in", "wss://a.example", '["EOSE","s"]');
    expect(log).toHaveLength(MAX_LOG);
    expect(log.at(-1)?.key).toBe(MAX_LOG + 10);
  });
});

describe("redundancy model", () => {
  test("starts published to two relays, all online, safe", () => {
    expect(publishedCount(INITIAL_CARDS)).toBe(2);
    expect(aliveCount(INITIAL_CARDS)).toBe(2);
    expect(verdict(INITIAL_CARDS)).toBe("safe");
    expect(survivedOutage(INITIAL_CARDS)).toBe(false);
  });
  test("one outage survives, two outages lose the note, unpublishing everything is 'unpublished'", () => {
    const one = toggle(INITIAL_CARDS, "alpha", "online");
    expect(survivedOutage(one)).toBe(true);
    expect(nextVictim(one)).toBe("beta");
    const two = toggle(one, "beta", "online");
    expect(verdict(two)).toBe("lost");
    expect(nextVictim(two)).toBeUndefined();
    expect(survivedOutage(two)).toBe(false);
    const none = toggle(toggle(INITIAL_CARDS, "alpha", "published"), "beta", "published");
    expect(verdict(none)).toBe("unpublished");
  });
  test("toggle is immutable", () => {
    const next = toggle(INITIAL_CARDS, "gamma", "published");
    expect(next).not.toBe(INITIAL_CARDS);
    expect(INITIAL_CARDS.find((c) => c.id === "gamma")?.published).toBe(false);
    expect(next.find((c) => c.id === "gamma")?.published).toBe(true);
  });
});
