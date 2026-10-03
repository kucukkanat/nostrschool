import { vars } from "@nostrschool/tokens";
import type { PacketType } from "./types.ts";

/**
 * Riso spot fill (CSS var reference) per packet type. Always drawn as an ink-outlined chip with
 * `vars.color.onPacket` (ink) text; `custom` (non-relay traffic: HTTP, NIP-46…) is the marker yellow.
 */
export const PACKET_COLORS: Readonly<Record<PacketType, string>> = {
  EVENT: vars.color.packetEvent,
  REQ: vars.color.packetReq,
  CLOSE: vars.color.packetClose,
  AUTH: vars.color.packetAuth,
  COUNT: vars.color.packetCount,
  OK: vars.color.packetOk,
  EOSE: vars.color.packetEose,
  CLOSED: vars.color.packetClosed,
  NOTICE: vars.color.packetNotice,
  custom: vars.color.highlight,
};
