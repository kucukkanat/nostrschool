/** Who tries to open the envelope in the lab: the recipient, an outsider, or the relay itself. */
import { getPersona } from "@nostrschool/fixtures";

export type ViewerId = "bob" | "carol" | "relay";
export const VIEWERS: readonly ViewerId[] = ["bob", "carol", "relay"];

/** Demo personas' public-by-design keys; the relay has none, which is the whole point. */
export const viewerKey = (viewer: ViewerId): Uint8Array | undefined =>
  viewer === "relay" ? undefined : getPersona(viewer).secretKey;
