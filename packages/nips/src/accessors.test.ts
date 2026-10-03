import { describe, expect, test } from "bun:test";
import { getNipMeta, getNipRelations, NIP_INDEX, nipsForKind, nipsWithStatus } from "./index.ts";
import { filterNips, type NipListing, nipRelations } from "./search.ts";

const ids = (nips: readonly { readonly id: string }[]) => nips.map((n) => n.id);
// Real snapshot metadata as listings (the variant does not matter to these filters).
const listings: readonly NipListing[] = NIP_INDEX.nips.map((n) => ({
  ...n,
  variant: "event",
  todo: true,
}));

describe("corpus accessors", () => {
  test("nipsForKind: kinds table and examples", () => {
    expect(ids(nipsForKind(9735))).toContain("57");
    expect(ids(nipsForKind(39001))).toContain("29"); // inside a README range
    expect(nipsForKind(65000)).toEqual([]);
  });

  test("nipsWithStatus", () => {
    expect(ids(nipsWithStatus("deprecated"))).toEqual(["12", "16", "20", "33"]);
    expect(ids(nipsWithStatus("final", "deprecated"))).toEqual([
      "02",
      "05",
      "12",
      "16",
      "20",
      "33",
    ]);
    expect(nipsWithStatus()).toEqual([]);
  });

  test("dependencies and dependents resolve to metadata in id order", () => {
    const rel = getNipRelations("17");
    expect(ids(rel?.dependencies ?? [])).toEqual(["21", "25", "42", "44", "59"]);
    expect(ids(rel?.dependents ?? [])).toEqual(["04", "11", "51", "59", "A4", "EE"]);
    expect(getNipRelations("ZZ")).toBeUndefined();
    const nip = getNipMeta("17");
    if (nip === undefined) throw new Error("NIP-17 missing");
    // Ids not in the given list are dropped.
    expect(ids(nipRelations(listings.slice(0, 20), nip).dependencies)).toEqual([]);
  });

  test("dependsOn filter: NIPs that build on NIP-44", () => {
    const users = ids(filterNips(listings, { dependsOn: "44" }));
    expect(users).toEqual(expect.arrayContaining(["17", "46", "59"]));
    expect(users).not.toContain("44");
    expect(ids(filterNips(listings, { dependsOn: "44", statuses: ["final"] }))).toEqual([]);
  });
});
