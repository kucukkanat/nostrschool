// Owner: spec author r6 (NIPs letter ids). NIP-BE: Nostr BLE Communications Protocol.
// UNRECOMMENDED: implemented only once and unreviewed; the NIP names no replacement, so the
// walkthrough says so and points at ordinary relays + NIP-77 sync. A behaviour NIP: two
// devices, one acting as relay (GATT server), syncing over Bluetooth Low Energy.
// Explanations: packages/i18n/src/locales/en/nips/r6.ts → nBE.text.
import type { NipSpec } from "../spec.ts";

const SERVICE_UUID = "0000180f-0000-1000-8000-00805f9b34fb";
const FILTER = { kinds: [1], since: 1735689600 };

export const nipBE: NipSpec = {
  nip: "BE",
  variant: "process",
  howItWorks: [
    { id: "status", title: "how.status.title", body: "how.status.body" },
    { id: "advertise", title: "how.advertise.title", body: "how.advertise.body" },
    { id: "roles", title: "how.roles.title", body: "how.roles.body" },
    { id: "chunks", title: "how.chunks.title", body: "how.chunks.body" },
    { id: "sync", title: "how.sync.title", body: "how.sync.body" },
    { id: "spread", title: "how.spread.title", body: "how.spread.body" },
  ],
  related: [
    { nip: "77", relation: "depends-on", explain: "related.77" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  process: {
    actors: [
      { id: "phone", label: "actor.phone", kind: "client" },
      { id: "peer", label: "actor.peer", kind: "relay" },
    ],
    steps: [
      {
        id: "advertise",
        from: "peer",
        label: "step.advertise.label",
        explain: "step.advertise.explain",
        payload: { serviceUuid: SERVICE_UUID, data: "<device UUID bytes>" },
      },
      {
        id: "roles",
        from: "phone",
        label: "step.roles.label",
        explain: "step.roles.explain",
        payload: {
          rule: "highest device UUID becomes the GATT server (relay)",
          alwaysServer: "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
          alwaysClient: "00000000-0000-0000-0000-000000000000",
        },
      },
      {
        id: "neg-open",
        from: "phone",
        to: "peer",
        label: "step.neg-open.label",
        explain: "step.neg-open.explain",
        packet: "NEG-OPEN",
        payload: ["NEG-OPEN", "ble-sync", FILTER, "6100000200"],
      },
      {
        id: "write-success",
        from: "peer",
        to: "phone",
        label: "step.write-success.label",
        explain: "step.write-success.explain",
        packet: "custom",
        payload: "write-success",
      },
      {
        id: "read",
        from: "phone",
        to: "peer",
        label: "step.read.label",
        explain: "step.read.explain",
        packet: "custom",
        payload: "read-message",
      },
      {
        id: "neg-msg",
        from: "peer",
        to: "phone",
        label: "step.neg-msg.label",
        explain: "step.neg-msg.explain",
        packet: "NEG-MSG",
        payload: ["NEG-MSG", "ble-sync", "6100000202"],
      },
      {
        id: "send-event",
        from: "phone",
        to: "peer",
        label: "step.send-event.label",
        explain: "step.send-event.explain",
        packet: "EVENT",
        payload: ["EVENT", { kind: 1, content: "Written offline at the festival", tags: [] }],
      },
      {
        id: "receive",
        from: "peer",
        to: "phone",
        label: "step.receive.label",
        explain: "step.receive.explain",
        packet: "EOSE",
        payload: ["EOSE", "ble-sync"],
      },
      {
        id: "notify",
        from: "peer",
        to: "phone",
        label: "step.notify.label",
        explain: "step.notify.explain",
        packet: "custom",
        payload: { characteristic: "12345678-0000-1000-8000-00805f9b34fb", value: "" },
      },
    ],
  },
};
