/**
 * Chapter 07 graph logic: turns the fixtures' kind 3 follow lists into a ForceGraph-ready
 * graph, plus the small queries the explorer panel needs. Pure and fixture-driven.
 */
import type { GraphLink, GraphNode } from "@nostrschool/diagrams";
import { followGraph, PERSONAS, type PersonaId, personaByPubkey } from "@nostrschool/fixtures";
import { LOCALE_TAGS, type Locale } from "@nostrschool/i18n";

export type Lens = "follows" | "followers";

export interface FollowIndex {
  readonly follows: ReadonlyMap<PersonaId, readonly PersonaId[]>;
  readonly followers: ReadonlyMap<PersonaId, readonly PersonaId[]>;
}

export { isPersonaId } from "@nostrschool/fixtures";

const ORDER: readonly PersonaId[] = PERSONAS.map((p) => p.id);
const byOrder = (a: PersonaId, b: PersonaId): number => ORDER.indexOf(a) - ORDER.indexOf(b);

/** Follow edges as persona ids (pubkeys that aren't personas are dropped: we can't draw them). */
export const followEdges = (): readonly (readonly [PersonaId, PersonaId])[] =>
  followGraph().edges.flatMap((e) => {
    const from = personaByPubkey(e.from)?.id;
    const to = personaByPubkey(e.to)?.id;
    return from !== undefined && to !== undefined ? [[from, to] as const] : [];
  });

export const indexFollows = (edges: readonly (readonly [PersonaId, PersonaId])[]): FollowIndex => {
  const collect = (pick: 0 | 1): ReadonlyMap<PersonaId, readonly PersonaId[]> =>
    new Map(
      ORDER.map((id) => [
        id,
        edges
          .filter((e) => e[pick] === id)
          .map((e) => e[pick === 0 ? 1 : 0])
          .sort(byOrder),
      ]),
    );
  return { follows: collect(0), followers: collect(1) };
};

export const FOLLOWS: FollowIndex = indexFollows(followEdges());

export const isMutual = (index: FollowIndex, a: PersonaId, b: PersonaId): boolean =>
  (index.follows.get(a) ?? []).includes(b) && (index.follows.get(b) ?? []).includes(a);

/** People seen through a lens: whom `id` follows, or who follows `id`. */
export const lensIds = (index: FollowIndex, id: PersonaId, lens: Lens): readonly PersonaId[] =>
  (lens === "follows" ? index.follows : index.followers).get(id) ?? [];

/**
 * ForceGraph input. A follow-back pair becomes ONE "mutual" link (double arrow), so the drawing
 * shows each relationship once instead of two overlapping arrows.
 */
export const toGraph = (
  index: FollowIndex,
): { readonly nodes: readonly GraphNode[]; readonly links: readonly GraphLink[] } => ({
  nodes: PERSONAS.map((p) => ({ id: p.id, label: p.displayName, avatar: p.avatar })),
  links: ORDER.flatMap((from) =>
    (index.follows.get(from) ?? []).flatMap((to): GraphLink[] => {
      if (!isMutual(index, from, to)) return [{ source: from, target: to, kind: "follows" }];
      // Emit the mutual pair once, from the earlier persona.
      return byOrder(from, to) < 0 ? [{ source: from, target: to, kind: "mutual" }] : [];
    }),
  ),
});

export interface NetworkStats {
  readonly people: number;
  readonly links: number;
  readonly mutualPairs: number;
  readonly mostFollowed: { readonly id: PersonaId; readonly count: number };
}

export const networkStats = (index: FollowIndex): NetworkStats => {
  const counts = ORDER.map((id) => ({ id, count: (index.followers.get(id) ?? []).length }));
  const mostFollowed = counts.reduce((best, c) => (c.count > best.count ? c : best), {
    id: ORDER[0] ?? "alice",
    count: -1,
  });
  const links = [...index.follows.values()].reduce((n, f) => n + f.length, 0);
  const mutualPairs =
    ORDER.flatMap((a) => (index.follows.get(a) ?? []).filter((b) => isMutual(index, a, b))).length /
    2;
  return { people: ORDER.length, links, mutualPairs, mostFollowed };
};

/** "Alice, Bob, and Carol" in the learner's language; `none` for an empty list. */
export const listNames = (locale: Locale, names: readonly string[], none: string): string =>
  names.length === 0
    ? none
    : new Intl.ListFormat(LOCALE_TAGS[locale], { style: "long", type: "conjunction" }).format(
        names,
      );
