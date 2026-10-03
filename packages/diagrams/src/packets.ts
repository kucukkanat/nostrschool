import { vars } from "@nostrschool/tokens";
import type { PacketType } from "./types.ts";

/** Fill color (CSS var reference) per packet type; text uses `vars.color.onPacket`. */
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
  custom: vars.color.diagramEdgeActive,
};
