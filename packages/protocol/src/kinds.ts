/**
 * Event kind registry and NIP-01 kind-range classification (chapter 6, kinds tool).
 * Localized names/descriptions live in @nostrschool/i18n under `kinds[i18nKey]`.
 */

/**
 * How relays store a kind (NIP-01):
 * - regular: every event is kept
 * - replaceable: only the latest per (pubkey, kind) is kept
 * - ephemeral: not stored, only forwarded to live subscribers
 * - addressable: only the latest per (pubkey, kind, d-tag) is kept
 */
export type KindCategory = "regular" | "replaceable" | "ephemeral" | "addressable";

export const KIND_CATEGORIES: readonly KindCategory[] = [
  "regular",
  "replaceable",
  "ephemeral",
  "addressable",
];

/** i18n key for a kind's name/description, e.g. `k1`. */
export type KindI18nKey = `k${number}`;

export interface KindInfo {
  readonly kind: number;
  /** English canonical name; UI should prefer the localized `kinds[i18nKey].name`. */
  readonly name: string;
  readonly category: KindCategory;
  /** Defining NIP as a two-character (or hex) id, e.g. "01", "57". Link: https://github.com/nostr-protocol/nips/blob/master/<nip>.md */
  readonly nip: string;
  readonly i18nKey: KindI18nKey;
  /** Set when the defining NIP is marked "unrecommended" in the NIPs README, so UIs can flag it as deprecated. */
  readonly unrecommended?: true;
}

/** Classifies ANY kind number by NIP-01 ranges (unknown kinds included). */
export const classifyKind = (kind: number): KindCategory => {
  if ((kind >= 10000 && kind < 20000) || kind === 0 || kind === 3) return "replaceable";
  if (kind >= 20000 && kind < 30000) return "ephemeral";
  if (kind >= 30000 && kind < 40000) return "addressable";
  return "regular";
};

/** Curated, well-known kinds shown in the "periodic table". Sorted by kind number. */
export const KINDS: readonly KindInfo[] = [
  { kind: 0, name: "User metadata", category: "replaceable", nip: "01", i18nKey: "k0" },
  { kind: 1, name: "Short text note", category: "regular", nip: "10", i18nKey: "k1" },
  { kind: 3, name: "Follow list", category: "replaceable", nip: "02", i18nKey: "k3" },
  {
    kind: 4,
    name: "Encrypted direct message",
    category: "regular",
    nip: "04",
    i18nKey: "k4",
    unrecommended: true,
  },
  { kind: 5, name: "Deletion request", category: "regular", nip: "09", i18nKey: "k5" },
  { kind: 6, name: "Repost", category: "regular", nip: "18", i18nKey: "k6" },
  { kind: 7, name: "Reaction", category: "regular", nip: "25", i18nKey: "k7" },
  { kind: 8, name: "Badge award", category: "regular", nip: "58", i18nKey: "k8" },
  { kind: 9, name: "Chat message", category: "regular", nip: "C7", i18nKey: "k9" },
  { kind: 11, name: "Thread", category: "regular", nip: "7D", i18nKey: "k11" },
  { kind: 13, name: "Seal", category: "regular", nip: "59", i18nKey: "k13" },
  { kind: 14, name: "Chat message", category: "regular", nip: "17", i18nKey: "k14" },
  { kind: 15, name: "File message", category: "regular", nip: "17", i18nKey: "k15" },
  { kind: 16, name: "Generic repost", category: "regular", nip: "18", i18nKey: "k16" },
  { kind: 17, name: "Website reaction", category: "regular", nip: "25", i18nKey: "k17" },
  { kind: 20, name: "Picture", category: "regular", nip: "68", i18nKey: "k20" },
  { kind: 21, name: "Video", category: "regular", nip: "71", i18nKey: "k21" },
  {
    kind: 40,
    name: "Channel creation",
    category: "regular",
    nip: "28",
    i18nKey: "k40",
    unrecommended: true,
  },
  {
    kind: 41,
    name: "Channel metadata",
    category: "regular",
    nip: "28",
    i18nKey: "k41",
    unrecommended: true,
  },
  {
    kind: 42,
    name: "Channel message",
    category: "regular",
    nip: "28",
    i18nKey: "k42",
    unrecommended: true,
  },
  {
    kind: 1040,
    name: "OpenTimestamps attestation",
    category: "regular",
    nip: "03",
    i18nKey: "k1040",
    unrecommended: true,
  },
  { kind: 1059, name: "Gift wrap", category: "regular", nip: "59", i18nKey: "k1059" },
  { kind: 1063, name: "File metadata", category: "regular", nip: "94", i18nKey: "k1063" },
  { kind: 1068, name: "Poll", category: "regular", nip: "88", i18nKey: "k1068" },
  { kind: 1111, name: "Comment", category: "regular", nip: "22", i18nKey: "k1111" },
  { kind: 1311, name: "Live chat message", category: "regular", nip: "53", i18nKey: "k1311" },
  { kind: 1617, name: "Git patch", category: "regular", nip: "34", i18nKey: "k1617" },
  { kind: 1984, name: "Report", category: "regular", nip: "56", i18nKey: "k1984" },
  { kind: 1985, name: "Label", category: "regular", nip: "32", i18nKey: "k1985" },
  {
    kind: 7000,
    name: "Job feedback",
    category: "regular",
    nip: "90",
    i18nKey: "k7000",
    unrecommended: true,
  },
  { kind: 9041, name: "Zap goal", category: "regular", nip: "75", i18nKey: "k9041" },
  { kind: 9734, name: "Zap request", category: "regular", nip: "57", i18nKey: "k9734" },
  { kind: 9735, name: "Zap receipt", category: "regular", nip: "57", i18nKey: "k9735" },
  { kind: 9802, name: "Highlight", category: "regular", nip: "84", i18nKey: "k9802" },
  { kind: 10000, name: "Mute list", category: "replaceable", nip: "51", i18nKey: "k10000" },
  { kind: 10001, name: "Pinned notes", category: "replaceable", nip: "51", i18nKey: "k10001" },
  { kind: 10002, name: "Relay list", category: "replaceable", nip: "65", i18nKey: "k10002" },
  { kind: 10003, name: "Bookmarks", category: "replaceable", nip: "51", i18nKey: "k10003" },
  { kind: 10008, name: "Profile badges", category: "replaceable", nip: "58", i18nKey: "k10008" },
  { kind: 10050, name: "DM relay list", category: "replaceable", nip: "17", i18nKey: "k10050" },
  { kind: 13194, name: "Wallet info", category: "replaceable", nip: "47", i18nKey: "k13194" },
  {
    kind: 22242,
    name: "Client authentication",
    category: "ephemeral",
    nip: "42",
    i18nKey: "k22242",
  },
  { kind: 23194, name: "Wallet request", category: "ephemeral", nip: "47", i18nKey: "k23194" },
  { kind: 23195, name: "Wallet response", category: "ephemeral", nip: "47", i18nKey: "k23195" },
  { kind: 24133, name: "Nostr Connect", category: "ephemeral", nip: "46", i18nKey: "k24133" },
  { kind: 27235, name: "HTTP auth", category: "ephemeral", nip: "98", i18nKey: "k27235" },
  { kind: 30000, name: "Follow set", category: "addressable", nip: "51", i18nKey: "k30000" },
  // NIP-58 moved profile badges to 10008; 30008 with d=profile_badges is legacy.
  { kind: 30008, name: "Badge set", category: "addressable", nip: "58", i18nKey: "k30008" },
  { kind: 30009, name: "Badge definition", category: "addressable", nip: "58", i18nKey: "k30009" },
  { kind: 30023, name: "Long-form article", category: "addressable", nip: "23", i18nKey: "k30023" },
  {
    kind: 30024,
    name: "Draft long-form article",
    category: "addressable",
    nip: "23",
    i18nKey: "k30024",
  },
  { kind: 30078, name: "Application data", category: "addressable", nip: "78", i18nKey: "k30078" },
  { kind: 30311, name: "Live event", category: "addressable", nip: "53", i18nKey: "k30311" },
  { kind: 30315, name: "User status", category: "addressable", nip: "38", i18nKey: "k30315" },
  {
    kind: 30402,
    name: "Classified listing",
    category: "addressable",
    nip: "99",
    i18nKey: "k30402",
  },
  {
    kind: 31922,
    name: "Date-based calendar event",
    category: "addressable",
    nip: "52",
    i18nKey: "k31922",
  },
  {
    kind: 31923,
    name: "Time-based calendar event",
    category: "addressable",
    nip: "52",
    i18nKey: "k31923",
  },
  {
    kind: 31989,
    name: "Handler recommendation",
    category: "addressable",
    nip: "89",
    i18nKey: "k31989",
  },
  {
    kind: 31990,
    name: "Handler information",
    category: "addressable",
    nip: "89",
    i18nKey: "k31990",
  },
  {
    kind: 34550,
    name: "Community definition",
    category: "addressable",
    nip: "72",
    i18nKey: "k34550",
    unrecommended: true,
  },
];

const byKind = new Map(KINDS.map((k) => [k.kind, k]));

/** Registry entry for a kind, or `undefined` if we don't document it. */
export const getKindInfo = (kind: number): KindInfo | undefined => byKind.get(kind);

/** Link to the NIP document on GitHub. */
export const nipUrl = (nip: string): string =>
  `https://github.com/nostr-protocol/nips/blob/master/${nip}.md`;
