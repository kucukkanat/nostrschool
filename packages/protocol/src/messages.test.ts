import { describe, expect, test } from "bun:test";
import { signEvent } from "./event.ts";
import { deriveSecretKey } from "./keys.ts";
import {
  type ClientMessage,
  parseClientMessage,
  parseRelayMessage,
  type RelayMessage,
  serializeMessage,
} from "./messages.ts";
import { unwrap } from "./result.ts";

const event = unwrap(
  signEvent({ kind: 1, created_at: 1, tags: [], content: "hi" }, deriveSecretKey("messages-test"), {
    auxRand: new Uint8Array(32),
  }),
).event;
const j = (v: unknown): string => JSON.stringify(v);
const code = (r: { ok: boolean; error?: { code: string } }): string =>
  r.ok ? "ok" : (r.error?.code ?? "");

describe("relay messages", () => {
  const valid: RelayMessage[] = [
    ["EVENT", "sub", event],
    ["OK", event.id, true, ""],
    ["OK", event.id, false, "blocked: spam"],
    ["EOSE", "sub"],
    ["CLOSED", "sub", "error: shutting down"],
    ["NOTICE", "hello"],
    ["AUTH", "challenge-123"],
    ["COUNT", "sub", { count: 42 }],
    ["COUNT", "sub", { count: 42, approximate: true }],
  ];
  test.each(valid.map((m) => [m[0], m] as const))("round-trips %s", (_t, m) => {
    expect(parseRelayMessage(serializeMessage(m))).toEqual({ ok: true, value: m });
  });

  test.each([
    ["{", "invalid-json"],
    [j({}), "not-an-array"],
    [j([]), "not-an-array"],
    [j([1]), "not-an-array"],
    [j(["PING"]), "unknown-type"],
    [j(["EVENT", "sub"]), "invalid-arity"],
    [j(["EVENT", "", event]), "invalid-field"],
    [j(["EVENT", "x".repeat(65), event]), "invalid-field"],
    [j(["EVENT", "sub", { ...event, id: "x" }]), "invalid-field"],
    [j(["OK", event.id, true]), "invalid-arity"],
    [j(["OK", "abc", true, ""]), "invalid-field"],
    [j(["OK", event.id, "true", ""]), "invalid-field"],
    [j(["OK", event.id, true, 1]), "invalid-field"],
    [j(["EOSE"]), "invalid-arity"],
    [j(["EOSE", 5]), "invalid-field"],
    [j(["CLOSED", "sub"]), "invalid-arity"],
    [j(["CLOSED", 1, "x"]), "invalid-field"],
    [j(["CLOSED", "sub", null]), "invalid-field"],
    [j(["NOTICE"]), "invalid-arity"],
    [j(["AUTH", 1]), "invalid-field"],
    [j(["COUNT", "sub"]), "invalid-arity"],
    [j(["COUNT", 1, { count: 1 }]), "invalid-field"],
    [j(["COUNT", "sub", null]), "invalid-field"],
    [j(["COUNT", "sub", { count: -1 }]), "invalid-field"],
    [j(["COUNT", "sub", { count: 1, approximate: "y" }]), "invalid-field"],
  ])("%s → %s", (raw, expected) => {
    expect(code(parseRelayMessage(raw))).toBe(expected);
  });
});

describe("client messages", () => {
  const valid: ClientMessage[] = [
    ["EVENT", event],
    ["AUTH", event],
    ["REQ", "feed", { kinds: [1], limit: 10 }],
    ["REQ", "feed", { kinds: [1] }, { "#p": [event.pubkey] }],
    ["COUNT", "c", { authors: [event.pubkey] }],
    ["CLOSE", "feed"],
  ];
  test.each(valid.map((m) => [m[0], m] as const))("round-trips %s", (_t, m) => {
    expect(parseClientMessage(serializeMessage(m))).toEqual({ ok: true, value: m });
  });

  test.each([
    ["[", "invalid-json"],
    [j("REQ"), "not-an-array"],
    [j(["OK"]), "unknown-type"],
    [j(["EVENT"]), "invalid-arity"],
    [j(["EVENT", {}]), "invalid-field"],
    [j(["REQ", "feed"]), "invalid-arity"],
    [j(["REQ", 1, {}]), "invalid-field"],
    [j(["REQ", "feed", { kinds: ["1"] }]), "invalid-field"],
    [j(["REQ", "feed", {}, { bogus: 1 }]), "invalid-field"],
    [j(["CLOSE"]), "invalid-arity"],
    [j(["CLOSE", ""]), "invalid-field"],
  ])("%s → %s", (raw, expected) => {
    expect(code(parseClientMessage(raw))).toBe(expected);
  });
});
