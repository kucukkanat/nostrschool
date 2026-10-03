/**
 * "What if…" scenarios: how bad a bad day is on each network, and which Nostr precautions help.
 * Outcome text lives in i18n under `scenarios.outcomes[platform][key]`.
 */
import { PLATFORMS, type PlatformId } from "./matrix.ts";

export const SCENARIOS = ["lostKey", "keyLeak", "relayBan", "serverGone", "spamFlood"] as const;
export type ScenarioId = (typeof SCENARIOS)[number];

export const PREPS = ["backup", "multiRelay", "wot"] as const;
export type PrepId = (typeof PREPS)[number];

export const SEVERITIES = ["fine", "bumpy", "ouch", "disaster"] as const;
export type Severity = (typeof SEVERITIES)[number];

export type NostrOutcomeKey =
  | ScenarioId
  | "lostKeyBackup"
  | "relayBanMulti"
  | "serverGoneMulti"
  | "spamFloodWot";

export interface Outcome {
  readonly scenario: ScenarioId;
  readonly severity: Severity;
  /** i18n key under `scenarios.outcomes[platform]`. */
  readonly key: NostrOutcomeKey;
}

interface NostrRule {
  readonly severity: Severity;
  /** The precaution that softens this scenario (keyLeak has none: no key rotation). */
  readonly helpedBy?: {
    readonly prep: PrepId;
    readonly severity: Severity;
    readonly key: NostrOutcomeKey;
  };
}

const NOSTR: Readonly<Record<ScenarioId, NostrRule>> = {
  lostKey: {
    severity: "disaster",
    helpedBy: { prep: "backup", severity: "fine", key: "lostKeyBackup" },
  },
  keyLeak: { severity: "disaster" },
  relayBan: {
    severity: "ouch",
    helpedBy: { prep: "multiRelay", severity: "fine", key: "relayBanMulti" },
  },
  serverGone: {
    severity: "ouch",
    helpedBy: { prep: "multiRelay", severity: "fine", key: "serverGoneMulti" },
  },
  spamFlood: {
    severity: "ouch",
    helpedBy: { prep: "wot", severity: "bumpy", key: "spamFloodWot" },
  },
};

type Others = Exclude<PlatformId, "nostr">;
const OTHERS: Readonly<Record<Others, Readonly<Record<ScenarioId, Severity>>>> = {
  x: {
    lostKey: "bumpy",
    keyLeak: "bumpy",
    relayBan: "disaster",
    serverGone: "disaster",
    spamFlood: "bumpy",
  },
  mastodon: {
    lostKey: "bumpy",
    keyLeak: "bumpy",
    relayBan: "ouch",
    serverGone: "disaster",
    spamFlood: "bumpy",
  },
  bluesky: {
    lostKey: "bumpy",
    keyLeak: "bumpy",
    relayBan: "ouch",
    serverGone: "ouch",
    spamFlood: "bumpy",
  },
};

export const outcomeFor = (
  platform: PlatformId,
  scenario: ScenarioId,
  preps: ReadonlySet<PrepId>,
): Outcome => {
  if (platform !== "nostr")
    return { scenario, severity: OTHERS[platform][scenario], key: scenario };
  const rule = NOSTR[scenario];
  return rule.helpedBy !== undefined && preps.has(rule.helpedBy.prep)
    ? { scenario, severity: rule.helpedBy.severity, key: rule.helpedBy.key }
    : { scenario, severity: rule.severity, key: scenario };
};

const rank = (s: Severity) => SEVERITIES.indexOf(s);

/** The worst of several severities; "fine" when nothing went wrong. */
export const worst = (severities: readonly Severity[]): Severity =>
  severities.reduce<Severity>((a, b) => (rank(b) > rank(a) ? b : a), "fine");

export interface PlatformReport {
  readonly platform: PlatformId;
  readonly outcomes: readonly Outcome[];
  readonly overall: Severity;
}

/** Scenarios are reported in SCENARIOS order regardless of toggle order. */
export const evaluate = (
  active: ReadonlySet<ScenarioId>,
  preps: ReadonlySet<PrepId>,
): readonly PlatformReport[] =>
  PLATFORMS.map((platform) => {
    const outcomes = SCENARIOS.filter((s) => active.has(s)).map((s) =>
      outcomeFor(platform, s, preps),
    );
    return { platform, outcomes, overall: worst(outcomes.map((o) => o.severity)) };
  });

export type MascotMood = "calm" | "worried" | "panic" | "prepared";

/** How the mascot feels about the Nostr column. */
export const mascotMood = (nostr: Severity, preps: ReadonlySet<PrepId>): MascotMood => {
  if (nostr === "disaster") return "panic";
  if (preps.size === PREPS.length) return "prepared";
  return nostr === "fine" ? "calm" : "worried";
};

/** 0–1 fill for the severity meter. */
export const severityLevel = (s: Severity): number => rank(s) / (SEVERITIES.length - 1);

export const toggleIn = <T>(set: ReadonlySet<T>, value: T, on: boolean): ReadonlySet<T> => {
  const next = new Set(set);
  if (on) next.add(value);
  else next.delete(value);
  return next;
};
