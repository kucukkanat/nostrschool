/**
 * Pure helpers behind the live frame log: classify a raw WebSocket frame, shorten it for
 * display, and keep a bounded log (live relays can be chatty; the DOM must stay small).
 */
import type { FrameDirection } from "@nostrschool/data";
import type { PacketType } from "@nostrschool/diagrams";
import { parseClientMessage, parseRelayMessage } from "@nostrschool/protocol";

export interface LoggedFrame {
  readonly key: number;
  readonly direction: FrameDirection;
  readonly relay: string;
  /** Verb from the parsed frame; "custom" if the frame isn't valid NIP-01 (shown, never trusted). */
  readonly verb: PacketType;
  readonly text: string;
  /** Characters cut from `text` (0 = complete). */
  readonly hidden: number;
}

/** Long enough to show a whole REQ/EOSE/OK and the start of an EVENT's JSON. */
export const MAX_FRAME_CHARS = 240;
/** Newest frames kept; older ones scroll away. */
export const MAX_LOG = 40;

/** "wss://nos.lol/" → "nos.lol"; anything unparsable is shown as-is. */
export const relayHost = (url: string): string => {
  if (!URL.canParse(url)) return url;
  const u = new URL(url);
  return u.port === "" ? u.hostname : `${u.hostname}:${u.port}`;
};

export const classifyFrame = (direction: FrameDirection, raw: string): PacketType => {
  const parsed = direction === "out" ? parseClientMessage(raw) : parseRelayMessage(raw);
  return parsed.ok ? parsed.value[0] : "custom";
};

export const truncate = (raw: string, max = MAX_FRAME_CHARS): { text: string; hidden: number } =>
  raw.length <= max
    ? { text: raw, hidden: 0 }
    : { text: raw.slice(0, max), hidden: raw.length - max };

export const logFrame = (
  log: readonly LoggedFrame[],
  key: number,
  direction: FrameDirection,
  relayUrl: string,
  raw: string,
): readonly LoggedFrame[] => [
  ...log.slice(-(MAX_LOG - 1)),
  {
    key,
    direction,
    relay: relayHost(relayUrl),
    verb: classifyFrame(direction, raw),
    ...truncate(raw),
  },
];

/** Filter used by the live demo: the 3 newest text notes, from whoever. Small on purpose. */
export const LIVE_FILTER = { kinds: [1], limit: 3 } as const;
