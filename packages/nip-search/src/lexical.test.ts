import { describe, expect, test } from "bun:test";
import { NIP_SEARCH_HINTS, NIP_SEARCH_HINTS_ES, searchHints, searchHintsFor } from "./aliases.ts";
import {
  createLexicalIndex,
  identifierBoost,
  isStopWord,
  processTerm,
  STOP_WORDS,
  STOP_WORDS_ES,
  tokenize,
  toLexicalDoc,
  wholeTerms,
} from "./lexical.ts";
import { ids, LISTINGS } from "./test-support.ts";

const index = createLexicalIndex(LISTINGS);
const top = (q: string, n = 3) => ids(index.search(q)).slice(0, n);

describe("processTerm", () => {
  test("lower-cases and drops stop words", () => {
    expect(processTerm("Zaps")).toBe("zaps");
    expect(processTerm("the")).toBeNull();
    expect(processTerm("")).toBeNull();
    expect(STOP_WORDS.has("nostr")).toBe(true);
  });

  test("folds accents, so typing without them still matches", () => {
    expect(processTerm("Relé")).toBe("rele");
    expect(processTerm("Información")).toBe("informacion");
  });
});

describe("tokenize", () => {
  test("words plus whole snake_case identifiers", () => {
    expect(tokenize("max_message_length, ok")).toEqual([
      "max",
      "message",
      "length",
      "ok",
      "max_message_length",
    ]);
  });
});

describe("identifierBoost", () => {
  test("whole identifiers up, their parts down, other words unchanged", () => {
    const terms = ["max", "message", "max_message_length", "relay"];
    expect(identifierBoost("max_message_length", 2, terms)).toBe(3);
    expect(identifierBoost("message", 1, terms)).toBeCloseTo(1 / 3);
    expect(identifierBoost("relay", 3, terms)).toBe(1);
  });
});

describe("toLexicalDoc", () => {
  test("flattens ids, hints, kinds (with ranges) and messages", () => {
    const nip29 = LISTINGS.find((n) => n.id === "29");
    const nip45 = LISTINGS.find((n) => n.id === "45");
    if (nip29 === undefined || nip45 === undefined) throw new Error("fixture NIPs missing");
    const doc = toLexicalDoc(nip29);
    expect(doc.nip).toBe("29 nip-29 nip29");
    expect(doc.hints).toContain("group chat");
    expect(doc.kinds).toContain("9000 9030 Group Control Events");
    expect(toLexicalDoc(nip45).messages).toContain("COUNT");
  });
});

describe("hints", () => {
  test("only for NIPs in the corpus; unknown ids have none", () => {
    const known = new Set(ids(LISTINGS));
    for (const hints of [NIP_SEARCH_HINTS, NIP_SEARCH_HINTS_ES])
      expect(Object.keys(hints).filter((id) => !known.has(id))).toEqual([]);
    expect(searchHints("FF")).toEqual([]);
  });

  test("Spanish hints only for the es locale", () => {
    expect(searchHintsFor("es", "56")).toContain("denunciar");
    expect(searchHintsFor("en", "56")).toEqual([]);
    expect(searchHintsFor("es", "FF")).toEqual([]);
  });
});

describe("lexical search", () => {
  test("title, kind description, message and tag words", () => {
    expect(top("zaps")[0]).toBe("57");
    expect(top("reactions")[0]).toBe("25");
    expect(top("COUNT")).toContain("45");
    expect(top("bolt11")).toContain("57");
  });

  test("typos (fuzzy) and as-you-type prefixes", () => {
    expect(top("reactons")).toContain("25");
    expect(top("highl")).toContain("84");
  });

  test("stop words alone match nothing; matches report terms and fields", () => {
    expect(index.search("the of and")).toEqual([]);
    const [first] = index.search("calendar");
    expect(first?.id).toBe("52");
    expect(first?.terms).toContain("calendar");
    expect(Object.keys(first?.fields ?? {})).toContain("title");
  });
});

describe("locale", () => {
  const es = createLexicalIndex(LISTINGS, { locale: "es" });
  const topEs = (q: string, n = 3) => ids(es.search(q)).slice(0, n);

  test("the es index holds the Spanish title and summary the cards show", () => {
    const nip88 = LISTINGS.find((n) => n.id === "88");
    if (nip88 === undefined) throw new Error("fixture NIP missing");
    expect(toLexicalDoc(nip88, "es").localTitle).not.toBe("");
    expect(toLexicalDoc(nip88).localTitle).toBe("");
    expect(top("encuestas")).toEqual([]);
    expect(topEs("encuestas")[0]).toBe("88");
  });

  test("Spanish stop words and hints; English queries still work", () => {
    expect(STOP_WORDS_ES.has("del")).toBe(true);
    expect(es.search("de la con para")).toEqual([]);
    expect(topEs("denunciar contenido")).toContain("56");
    expect(topEs("borrar mi nota")[0]).toBe("09");
    expect(topEs("informacion del rele")).toContain("11");
    expect(topEs("zaps")[0]).toBe("57");
  });
});

describe("identifiers", () => {
  test("indexes NipMeta.idents (inline code from the snapshot) as whole identifiers", () => {
    const nip11 = LISTINGS.find((n) => n.id === "11");
    if (nip11 === undefined) throw new Error("fixture NIP missing");
    expect(toLexicalDoc(nip11).idents).toContain("max_message_length");
    const found = createLexicalIndex(LISTINGS).search("max_message_length");
    expect(found[0]?.id).toBe("11");
    expect(found[0]?.terms).toContain("max_message_length");
  });
});

describe("definitions", () => {
  test("a term a NIP defines outranks NIPs that mention it", () => {
    const top = createLexicalIndex(LISTINGS).search("supported_nips");
    expect(top[0]?.id).toBe("11");
    expect(top[0]?.fields["defines"]).toEqual(["supported_nips"]);
    // Without the table NIP-11 is not first: the mentions win on idents.
    const none = { version: 1 as const, commit: "", terms: {} };
    expect(
      createLexicalIndex(LISTINGS, { definitions: none }).search("supported_nips")[0]?.id,
    ).not.toBe("11");
  });

  test("whole identifiers only: `block` does not hit `block_hash`; plain words skip the table", () => {
    const index = createLexicalIndex(LISTINGS);
    expect(index.search("`block`").some((m) => m.fields["defines"] !== undefined)).toBe(false);
    expect(index.search("relay").some((m) => m.fields["defines"] !== undefined)).toBe(false);
    expect(index.search('"d" tag addressable')[0]?.id).toBe("01");
  });

  test("wholeTerms strips surrounding punctuation only", () => {
    expect(wholeTerms(' "supported_nips", (nostr.json) `d` -- ')).toEqual([
      "supported_nips",
      "nostr.json",
      "d",
    ]);
  });
});

describe("isStopWord", () => {
  test("English and Spanish function words, any case, accents or edge punctuation", () => {
    for (const w of ["with", "The", "a", "de", "LA", "cómo", "with,", "(the)"])
      expect(isStopWord(w)).toBe(true);
    for (const w of ["zap", "relay", "delete", "borrar", "", "with_x"])
      expect(isStopWord(w)).toBe(false);
  });
});
