/**
 * Pure model behind the chapter 1 topology sandbox. A "conversation" is an ordered pair
 * (author, reader); it works when the author's post can travel to the reader through
 * infrastructure (servers/relays) that is online and has not banned either person.
 * People never forward each other's posts, so users are never transit nodes.
 */
import { type Dictionary, format } from "@nostrschool/i18n";
import { fail, ok, type ProtocolError, type Result } from "@nostrschool/protocol";

type Ch01 = Dictionary["chapters"]["ch01"];
type SandboxDict = Ch01["sandbox"];
export type NodeId = keyof SandboxDict["nodes"];
export type ModelId = keyof SandboxDict["models"];
export type NodeRole = keyof SandboxDict["roles"];

export interface SandboxNode {
  readonly id: NodeId;
  readonly role: NodeRole;
  /** Position in the 400 × 300 diagram box. */
  readonly x: number;
  readonly y: number;
}

/** Posts flow from → to; `oneWay: false` (default) means both directions. */
export interface SandboxLink {
  readonly from: NodeId;
  readonly to: NodeId;
  readonly oneWay?: boolean;
}

export interface NetworkModel {
  readonly id: ModelId;
  readonly nodes: readonly SandboxNode[];
  readonly links: readonly SandboxLink[];
  /**
   * NIP-65 outbox model: a reader's client connects to whatever relay the author writes to,
   * so every relay can deliver to every reader without an explicit link.
   */
  readonly outbox: boolean;
  /** Where each user's account lives. Absent ⇒ the identity is a key the user holds. */
  readonly homes: Readonly<Partial<Record<NodeId, NodeId>>>;
  /** Who bans Alice when the learner presses "Ban Alice". */
  readonly banAuthority: NodeId;
}

export interface SandboxState {
  readonly down: readonly NodeId[];
  readonly banned: boolean;
}

/** The one person the learner can deplatform: keeps the story focused. */
export const BANNABLE: NodeId = "alice";
export const INITIAL_STATE: SandboxState = { down: [], banned: false };

export type SandboxErrorCode = "duplicate-node" | "unknown-node" | "invalid-home" | "invalid-ban";
export type SandboxError = ProtocolError<SandboxErrorCode>;

const isInfra = (n: SandboxNode): boolean => n.role !== "user";

export const validateModel = (model: NetworkModel): Result<NetworkModel, SandboxError> => {
  const byId = new Map(model.nodes.map((n) => [n.id, n]));
  if (byId.size !== model.nodes.length)
    return fail("duplicate-node", `model ${model.id} has duplicate node ids`);
  const unknown = model.links.find((l) => !byId.has(l.from) || !byId.has(l.to));
  if (unknown !== undefined)
    return fail("unknown-node", `link ${unknown.from}→${unknown.to} references an unknown node`);
  const badHome = Object.entries(model.homes).find(([user, host]) => {
    const u = byId.get(user as NodeId);
    const h = host === undefined ? undefined : byId.get(host);
    return u?.role !== "user" || h === undefined || !isInfra(h);
  });
  if (badHome !== undefined)
    return fail(
      "invalid-home",
      `home ${badHome[0]}→${String(badHome[1])} must map a user to infra`,
    );
  const authority = byId.get(model.banAuthority);
  if (authority === undefined || !isInfra(authority) || !byId.has(BANNABLE))
    return fail("invalid-ban", `ban authority ${model.banAuthority} must be infra`);
  return ok(model);
};

export const users = (model: NetworkModel): readonly NodeId[] =>
  model.nodes.filter((n) => n.role === "user").map((n) => n.id);

export const infra = (model: NetworkModel): readonly NodeId[] =>
  model.nodes.filter(isInfra).map((n) => n.id);

const roleOf = (model: NetworkModel, id: NodeId): NodeRole | undefined =>
  model.nodes.find((n) => n.id === id)?.role;

/** Directed adjacency including the implicit relay → reader hops of the outbox model. */
const successors = (model: NetworkModel): ReadonlyMap<NodeId, readonly NodeId[]> => {
  const explicit = model.links.flatMap((l) =>
    l.oneWay === true
      ? [[l.from, l.to] as const]
      : [[l.from, l.to] as const, [l.to, l.from] as const],
  );
  const implicit = model.outbox
    ? model.nodes
        .filter((n) => n.role === "relay")
        .flatMap((r) => users(model).map((u) => [r.id, u] as const))
    : [];
  return [...explicit, ...implicit].reduce((m, [a, b]) => {
    const list = m.get(a) ?? [];
    if (!list.includes(b)) m.set(a, [...list, b]);
    return m;
  }, new Map<NodeId, NodeId[]>());
};

const isBlocked = (
  model: NetworkModel,
  state: SandboxState,
  node: NodeId,
  author: NodeId,
  reader: NodeId,
): boolean =>
  state.down.includes(node) ||
  (state.banned && node === model.banAuthority && (author === BANNABLE || reader === BANNABLE));

/** Can `author`'s post reach `reader`? Breadth-first over online, non-banning infrastructure. */
export const canReach = (
  model: NetworkModel,
  state: SandboxState,
  author: NodeId,
  reader: NodeId,
): boolean => {
  if (author === reader) return false;
  const next = successors(model);
  const seen = new Set<NodeId>([author]);
  const queue: NodeId[] = [author];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    for (const n of next.get(id) ?? []) {
      if (n === reader) return true;
      const transit = roleOf(model, n) !== "user" && !isBlocked(model, state, n, author, reader);
      if (transit && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return false;
};

export type Voice = "full" | "partial" | "silenced";
export type Account =
  | { readonly kind: "keys" }
  | { readonly kind: "hosted" | "lost" | "banned"; readonly host: NodeId };

export interface UserReport {
  readonly id: NodeId;
  /** Who can read this user's posts. */
  readonly audience: readonly NodeId[];
  readonly voice: Voice;
  readonly account: Account;
  /** Set when the learner's ban applies to this user (even if the account lives elsewhere). */
  readonly bannedBy: NodeId | null;
}

export interface Analysis {
  readonly users: readonly UserReport[];
  readonly alivePairs: number;
  readonly totalPairs: number;
  readonly silenced: readonly NodeId[];
}

export const voiceOf = (count: number, total: number): Voice =>
  count === 0 ? "silenced" : count >= total ? "full" : "partial";

export const accountOf = (model: NetworkModel, state: SandboxState, user: NodeId): Account => {
  const host = model.homes[user];
  if (host === undefined) return { kind: "keys" };
  if (state.down.includes(host)) return { kind: "lost", host };
  if (state.banned && user === BANNABLE && host === model.banAuthority)
    return { kind: "banned", host };
  return { kind: "hosted", host };
};

export const analyze = (model: NetworkModel, state: SandboxState): Analysis => {
  const people = users(model);
  const reports = people.map((u): UserReport => {
    const audience = people.filter((r) => canReach(model, state, u, r));
    return {
      id: u,
      audience,
      voice: voiceOf(audience.length, people.length - 1),
      account: accountOf(model, state, u),
      bannedBy: state.banned && u === BANNABLE ? model.banAuthority : null,
    };
  });
  return {
    users: reports,
    alivePairs: reports.reduce((sum, r) => sum + r.audience.length, 0),
    totalPairs: people.length * (people.length - 1),
    silenced: reports.filter((r) => r.voice === "silenced").map((r) => r.id),
  };
};

export const toggleDown = (state: SandboxState, id: NodeId): SandboxState => ({
  ...state,
  down: state.down.includes(id) ? state.down.filter((d) => d !== id) : [...state.down, id],
});

export const toggleBan = (state: SandboxState): SandboxState => ({
  ...state,
  banned: !state.banned,
});

export interface Outage {
  readonly node: NodeId;
  readonly alivePairs: number;
  readonly totalPairs: number;
  /** 0–100, rounded. */
  readonly percent: number;
}

/** The single server/relay whose loss breaks the most conversations (first one wins ties). */
export const worstSingleOutage = (model: NetworkModel): Outage => {
  const outages = infra(model).map((node): Outage => {
    const a = analyze(model, { down: [node], banned: false });
    return {
      node,
      alivePairs: a.alivePairs,
      totalPairs: a.totalPairs,
      percent: Math.round((100 * a.alivePairs) / Math.max(1, a.totalPairs)),
    };
  });
  return outages.reduce((worst, o) => (o.alivePairs < worst.alivePairs ? o : worst));
};

export type Change =
  | { readonly type: "down" | "up"; readonly node: NodeId }
  | { readonly type: "banned" | "unbanned" | "reset" | "model" };

/** One aria-live sentence: what changed, who lost their voice, and the overall health. */
export const narrate = (
  t: SandboxDict,
  model: NetworkModel,
  change: Change,
  analysis: Analysis,
  joinNames: (names: readonly string[]) => string,
): string => {
  const name = (id: NodeId): string => t.nodes[id];
  const what = ((): string => {
    switch (change.type) {
      case "down":
        return format(t.narration.down, { name: name(change.node) });
      case "up":
        return format(t.narration.up, { name: name(change.node) });
      case "banned":
        return format(t.narration.banned, { host: name(model.banAuthority) });
      case "unbanned":
        return format(t.narration.unbanned, { host: name(model.banAuthority) });
      case "reset":
        return t.narration.reset;
      case "model":
        return format(t.narration.model, { model: t.models[model.id].label });
    }
  })();
  const who =
    analysis.silenced.length === 0
      ? t.narration.nobodySilenced
      : format(t.narration.silenced, { names: joinNames(analysis.silenced.map(name)) });
  const health = format(t.narration.health, {
    alive: analysis.alivePairs,
    total: analysis.totalPairs,
  });
  return `${what} ${who} ${health}`;
};

export type Verdict = keyof SandboxDict["verdict"];

export const verdictOf = (a: Analysis): Verdict =>
  a.alivePairs === a.totalPairs ? "allGood" : a.alivePairs === 0 ? "collapsed" : "degraded";
