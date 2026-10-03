/**
 * NIP-01 wire messages as typed tuples, plus parse/serialize that validate shape.
 * Chapter 4 renders these frames; data/test-relay speak them.
 */
import { parseJson, validateEventShape } from "./event.ts";
import { validateFilter } from "./filter.ts";
import { fail, ok, type ProtocolError, type Result } from "./result.ts";
import type { Filter, NostrEvent } from "./types.ts";

/** Client → relay. */
export type ClientMessage =
  | readonly ["EVENT", NostrEvent]
  | readonly ["REQ", subscriptionId: string, ...filters: Filter[]]
  | readonly ["CLOSE", subscriptionId: string]
  | readonly ["AUTH", NostrEvent]
  | readonly ["COUNT", subscriptionId: string, ...filters: Filter[]];

/** Relay → client. */
export type RelayMessage =
  | readonly ["EVENT", subscriptionId: string, NostrEvent]
  | readonly ["OK", eventId: string, accepted: boolean, message: string]
  | readonly ["EOSE", subscriptionId: string]
  | readonly ["CLOSED", subscriptionId: string, message: string]
  | readonly ["NOTICE", message: string]
  | readonly ["AUTH", challenge: string]
  | readonly [
      "COUNT",
      subscriptionId: string,
      { readonly count: number; readonly approximate?: boolean },
    ];

export type ClientMessageType = ClientMessage[0];
export type RelayMessageType = RelayMessage[0];
/** Every verb that can appear on the wire; drives packet colors (`--color-packet-*`). */
export type MessageType = ClientMessageType | RelayMessageType;

export type MessageParseErrorCode =
  | "invalid-json"
  | "not-an-array"
  | "unknown-type"
  | "invalid-arity"
  | "invalid-field";
export type MessageParseError = ProtocolError<MessageParseErrorCode>;

type ParseResult<T> = Result<T, MessageParseError>;

const invalidField = (message: string): ParseResult<never> => fail("invalid-field", message);

/** Parses JSON and checks it is a non-empty array whose first element is a string verb. */
const parseFrame = (raw: string): ParseResult<readonly [string, ...unknown[]]> => {
  const parsed = parseJson(raw);
  if (!parsed.ok) return fail("invalid-json", parsed.error.message);
  const frame = parsed.value;
  if (!Array.isArray(frame) || frame.length === 0 || typeof frame[0] !== "string")
    return fail("not-an-array", "A message must be a JSON array starting with a type string");
  return ok(frame as [string, ...unknown[]]);
};

const arity = (type: string, args: readonly unknown[], min: number, max = min) =>
  args.length >= min && args.length <= max
    ? ok(args)
    : fail(
        "invalid-arity",
        `${type} expects ${min === max ? min : `${min}+`} arguments, got ${args.length}`,
      );

/** NIP-01: subscription ids are non-empty strings of at most 64 chars. */
const subId = (v: unknown): ParseResult<string> =>
  typeof v === "string" && v.length > 0 && v.length <= 64
    ? ok(v)
    : invalidField("Subscription id must be a 1–64 char string");

const str = (v: unknown, what: string): ParseResult<string> =>
  typeof v === "string" ? ok(v) : invalidField(`${what} must be a string`);

const event = (v: unknown): ParseResult<NostrEvent> => {
  const e = validateEventShape(v);
  return e.ok ? e : invalidField(`Invalid event: ${e.error.message}`);
};

const filters = (vs: readonly unknown[]): ParseResult<Filter[]> =>
  vs.reduce<ParseResult<Filter[]>>((acc, v) => {
    if (!acc.ok) return acc;
    const f = validateFilter(v);
    return f.ok ? ok([...acc.value, f.value]) : invalidField(`Invalid filter: ${f.error.message}`);
  }, ok([]));

const subWithFilters = <T extends "REQ" | "COUNT">(
  type: T,
  args: readonly unknown[],
): ParseResult<readonly [T, string, ...Filter[]]> => {
  const a = arity(type, args, 2, Number.POSITIVE_INFINITY);
  if (!a.ok) return a;
  const id = subId(args[0]);
  if (!id.ok) return id;
  const fs = filters(args.slice(1));
  return fs.ok ? ok([type, id.value, ...fs.value]) : fs;
};

/** Parses and shape-validates a raw relay frame. Does NOT verify event signatures. */
export const parseRelayMessage = (raw: string): ParseResult<RelayMessage> => {
  const frame = parseFrame(raw);
  if (!frame.ok) return frame;
  const [type, ...args] = frame.value;
  switch (type) {
    case "EVENT": {
      const a = arity(type, args, 2);
      if (!a.ok) return a;
      const id = subId(args[0]);
      if (!id.ok) return id;
      const e = event(args[1]);
      return e.ok ? ok([type, id.value, e.value]) : e;
    }
    case "OK": {
      const a = arity(type, args, 3);
      if (!a.ok) return a;
      const [eventId, accepted, message] = args;
      if (typeof eventId !== "string" || !/^[0-9a-f]{64}$/.test(eventId))
        return invalidField("OK event id must be 64 lowercase hex chars");
      if (typeof accepted !== "boolean") return invalidField("OK accepted flag must be a boolean");
      const m = str(message, "OK message");
      return m.ok ? ok([type, eventId, accepted, m.value]) : m;
    }
    case "EOSE": {
      const a = arity(type, args, 1);
      if (!a.ok) return a;
      const id = subId(args[0]);
      return id.ok ? ok([type, id.value]) : id;
    }
    case "CLOSED": {
      const a = arity(type, args, 2);
      if (!a.ok) return a;
      const id = subId(args[0]);
      if (!id.ok) return id;
      const m = str(args[1], "CLOSED message");
      return m.ok ? ok([type, id.value, m.value]) : m;
    }
    case "NOTICE":
    case "AUTH": {
      const a = arity(type, args, 1);
      if (!a.ok) return a;
      const m = str(args[0], `${type} payload`);
      return m.ok ? ok([type, m.value]) : m;
    }
    case "COUNT": {
      const a = arity(type, args, 2);
      if (!a.ok) return a;
      const id = subId(args[0]);
      if (!id.ok) return id;
      const body = args[1] as { count?: unknown; approximate?: unknown } | null;
      const count = typeof body === "object" && body !== null ? body.count : undefined;
      const approximate = typeof body === "object" && body !== null ? body.approximate : undefined;
      if (typeof count !== "number" || !Number.isInteger(count) || count < 0)
        return invalidField("COUNT result needs a non-negative integer count");
      if (approximate !== undefined && typeof approximate !== "boolean")
        return invalidField("COUNT approximate must be a boolean");
      return ok([type, id.value, approximate === undefined ? { count } : { count, approximate }]);
    }
    default:
      return fail("unknown-type", `Unknown relay message type "${type}"`);
  }
};

/** Parses and shape-validates a raw client frame (used by the test relay). */
export const parseClientMessage = (raw: string): ParseResult<ClientMessage> => {
  const frame = parseFrame(raw);
  if (!frame.ok) return frame;
  const [type, ...args] = frame.value;
  switch (type) {
    case "EVENT":
    case "AUTH": {
      const a = arity(type, args, 1);
      if (!a.ok) return a;
      const e = event(args[0]);
      return e.ok ? ok([type, e.value]) : e;
    }
    case "REQ":
    case "COUNT":
      return subWithFilters(type, args);
    case "CLOSE": {
      const a = arity(type, args, 1);
      if (!a.ok) return a;
      const id = subId(args[0]);
      return id.ok ? ok([type, id.value]) : id;
    }
    default:
      return fail("unknown-type", `Unknown client message type "${type}"`);
  }
};

/** JSON-encodes a message exactly as it goes on the wire. */
export const serializeMessage = (message: ClientMessage | RelayMessage): string =>
  JSON.stringify(message);
