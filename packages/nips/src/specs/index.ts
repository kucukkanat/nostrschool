/**
 * Static index of every NIP spec. One file per NIP id in the corpus; `specs.test.ts` fails when
 * the corpus has an id without a spec (after `bun run snapshot:nips`) or a spec has no NIP.
 * Build-time and page-level import: an island should receive only its own spec as a prop.
 */
import { NIP_INDEX } from "../index.ts";
import type { NipListing } from "../search.ts";
import type { NipSpec } from "../spec.ts";
import type { NipId } from "../types.ts";
import { nip5A } from "./nip-5A.ts";
import { nip7D } from "./nip-7D.ts";
import { nip01 } from "./nip-01.ts";
import { nip02 } from "./nip-02.ts";
import { nip03 } from "./nip-03.ts";
import { nip04 } from "./nip-04.ts";
import { nip05 } from "./nip-05.ts";
import { nip06 } from "./nip-06.ts";
import { nip07 } from "./nip-07.ts";
import { nip08 } from "./nip-08.ts";
import { nip09 } from "./nip-09.ts";
import { nip10 } from "./nip-10.ts";
import { nip11 } from "./nip-11.ts";
import { nip12 } from "./nip-12.ts";
import { nip13 } from "./nip-13.ts";
import { nip14 } from "./nip-14.ts";
import { nip15 } from "./nip-15.ts";
import { nip16 } from "./nip-16.ts";
import { nip17 } from "./nip-17.ts";
import { nip18 } from "./nip-18.ts";
import { nip19 } from "./nip-19.ts";
import { nip20 } from "./nip-20.ts";
import { nip21 } from "./nip-21.ts";
import { nip22 } from "./nip-22.ts";
import { nip23 } from "./nip-23.ts";
import { nip24 } from "./nip-24.ts";
import { nip25 } from "./nip-25.ts";
import { nip26 } from "./nip-26.ts";
import { nip27 } from "./nip-27.ts";
import { nip28 } from "./nip-28.ts";
import { nip29 } from "./nip-29.ts";
import { nip30 } from "./nip-30.ts";
import { nip31 } from "./nip-31.ts";
import { nip32 } from "./nip-32.ts";
import { nip33 } from "./nip-33.ts";
import { nip34 } from "./nip-34.ts";
import { nip35 } from "./nip-35.ts";
import { nip36 } from "./nip-36.ts";
import { nip37 } from "./nip-37.ts";
import { nip38 } from "./nip-38.ts";
import { nip39 } from "./nip-39.ts";
import { nip40 } from "./nip-40.ts";
import { nip42 } from "./nip-42.ts";
import { nip43 } from "./nip-43.ts";
import { nip44 } from "./nip-44.ts";
import { nip45 } from "./nip-45.ts";
import { nip46 } from "./nip-46.ts";
import { nip47 } from "./nip-47.ts";
import { nip48 } from "./nip-48.ts";
import { nip49 } from "./nip-49.ts";
import { nip50 } from "./nip-50.ts";
import { nip51 } from "./nip-51.ts";
import { nip52 } from "./nip-52.ts";
import { nip53 } from "./nip-53.ts";
import { nip54 } from "./nip-54.ts";
import { nip55 } from "./nip-55.ts";
import { nip56 } from "./nip-56.ts";
import { nip57 } from "./nip-57.ts";
import { nip58 } from "./nip-58.ts";
import { nip59 } from "./nip-59.ts";
import { nip60 } from "./nip-60.ts";
import { nip61 } from "./nip-61.ts";
import { nip62 } from "./nip-62.ts";
import { nip64 } from "./nip-64.ts";
import { nip65 } from "./nip-65.ts";
import { nip66 } from "./nip-66.ts";
import { nip67 } from "./nip-67.ts";
import { nip68 } from "./nip-68.ts";
import { nip69 } from "./nip-69.ts";
import { nip70 } from "./nip-70.ts";
import { nip71 } from "./nip-71.ts";
import { nip72 } from "./nip-72.ts";
import { nip73 } from "./nip-73.ts";
import { nip75 } from "./nip-75.ts";
import { nip77 } from "./nip-77.ts";
import { nip78 } from "./nip-78.ts";
import { nip84 } from "./nip-84.ts";
import { nip85 } from "./nip-85.ts";
import { nip86 } from "./nip-86.ts";
import { nip87 } from "./nip-87.ts";
import { nip88 } from "./nip-88.ts";
import { nip89 } from "./nip-89.ts";
import { nip90 } from "./nip-90.ts";
import { nip92 } from "./nip-92.ts";
import { nip94 } from "./nip-94.ts";
import { nip96 } from "./nip-96.ts";
import { nip98 } from "./nip-98.ts";
import { nip99 } from "./nip-99.ts";
import { nipA0 } from "./nip-A0.ts";
import { nipA3 } from "./nip-A3.ts";
import { nipA4 } from "./nip-A4.ts";
import { nipB0 } from "./nip-B0.ts";
import { nipB7 } from "./nip-B7.ts";
import { nipBE } from "./nip-BE.ts";
import { nipC0 } from "./nip-C0.ts";
import { nipC7 } from "./nip-C7.ts";
import { nipCC } from "./nip-CC.ts";
import { nipEE } from "./nip-EE.ts";
import { nipF4 } from "./nip-F4.ts";

export const NIP_SPECS: { readonly [id: NipId]: NipSpec } = {
  "01": nip01,
  "02": nip02,
  "03": nip03,
  "04": nip04,
  "05": nip05,
  "06": nip06,
  "07": nip07,
  "08": nip08,
  "09": nip09,
  "10": nip10,
  "11": nip11,
  "12": nip12,
  "13": nip13,
  "14": nip14,
  "15": nip15,
  "16": nip16,
  "17": nip17,
  "18": nip18,
  "19": nip19,
  "20": nip20,
  "21": nip21,
  "22": nip22,
  "23": nip23,
  "24": nip24,
  "25": nip25,
  "26": nip26,
  "27": nip27,
  "28": nip28,
  "29": nip29,
  "30": nip30,
  "31": nip31,
  "32": nip32,
  "33": nip33,
  "34": nip34,
  "35": nip35,
  "36": nip36,
  "37": nip37,
  "38": nip38,
  "39": nip39,
  "40": nip40,
  "42": nip42,
  "43": nip43,
  "44": nip44,
  "45": nip45,
  "46": nip46,
  "47": nip47,
  "48": nip48,
  "49": nip49,
  "50": nip50,
  "51": nip51,
  "52": nip52,
  "53": nip53,
  "54": nip54,
  "55": nip55,
  "56": nip56,
  "57": nip57,
  "58": nip58,
  "59": nip59,
  "5A": nip5A,
  "60": nip60,
  "61": nip61,
  "62": nip62,
  "64": nip64,
  "65": nip65,
  "66": nip66,
  "67": nip67,
  "68": nip68,
  "69": nip69,
  "70": nip70,
  "71": nip71,
  "72": nip72,
  "73": nip73,
  "75": nip75,
  "77": nip77,
  "78": nip78,
  "7D": nip7D,
  "84": nip84,
  "85": nip85,
  "86": nip86,
  "87": nip87,
  "88": nip88,
  "89": nip89,
  "90": nip90,
  "92": nip92,
  "94": nip94,
  "96": nip96,
  "98": nip98,
  "99": nip99,
  A0: nipA0,
  A3: nipA3,
  A4: nipA4,
  B0: nipB0,
  B7: nipB7,
  BE: nipBE,
  C0: nipC0,
  C7: nipC7,
  CC: nipCC,
  EE: nipEE,
  F4: nipF4,
};

/** The spec for a NIP id, or undefined if there is none. */
export const getSpec = (id: NipId): NipSpec | undefined => NIP_SPECS[id];

/** Every NIP in the snapshot joined with its spec's variant: what the list page renders. */
export const listNips = (): readonly NipListing[] =>
  NIP_INDEX.nips.flatMap((meta) => {
    const spec = NIP_SPECS[meta.id];
    return spec === undefined ? [] : [{ ...meta, variant: spec.variant, todo: spec.todo === true }];
  });
