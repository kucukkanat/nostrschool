// Owner: chapter 06 agent. UI strings for chapter 06 (kinds) components.
// Adding a key? Also add it to ../../es/chapters/06.ts (English placeholder + `// TODO(es)`).
export const ch06 = {
  title: "Kinds & NIPs",
  summary: "A periodic table of event kinds and the specs that define them.",
  table: {
    title: "The periodic table of kinds",
    description:
      "Every tile is an event kind. Filter by storage category or search, then pick a tile to see a real example event.",
    gridLabel: "Event kinds",
    search: "Search kinds",
    searchPlaceholder: "Number, name or NIP…",
    filtersLabel: "Show categories",
    all: "All",
    results: { zero: "No kinds match.", one: "{count} kind shown", other: "{count} kinds shown" },
    empty: "Nothing here. Try another search or switch a category back on.",
    tileLabel: "Kind {kind}: {name} ({category})",
    explored: "Explored {count} of {total} categories",
    allExplored: "You visited all four categories. Periodic-table master!",
  },
  detail: {
    placeholder: "Pick a tile to inspect a kind.",
    kind: "Kind {kind}",
    category: "Storage category",
    range: "Range: {range}",
    rule: "What relays do",
    definedIn: "Defined in",
    openNip: "Read {nip} on GitHub",
    example: "Example event",
    sourceFixture: "A real signed event from our fixture set.",
    sourceSigned: "Signed just now in your browser with Alice's demo key.",
    sourceRumor: "An unsigned rumor: it only ever travels inside a gift wrap.",
    filter: "Ask a relay for this kind",
    selected: "Selected kind {kind}: {name}. {category}.",
    unrecommended: "Unrecommended",
    unrecommendedHint:
      "The NIPs index marks this kind as unrecommended: new apps should not use it.",
    // Label of the small-screen link that returns focus from the detail panel to the picked tile.
    close: "Back to the table",
  },
  classifier: {
    title: "Kind number classifier",
    label: "Type any kind number (0–65535)",
    placeholder: "e.g. 30023",
    result: "Kind {kind} is {category}.",
    known: "We know this one: {name} ({nip}).",
    unknown: "Not in our table, but the number alone tells relays how to store it.",
    outside:
      "This number sits outside every NIP-01 range, so storage is up to each relay (most treat it as regular).",
    errors: {
      empty: "Type a number to classify it.",
      "not-an-integer": "Kinds are whole numbers, like 1 or 30023.",
      "out-of-range": "Kinds go from 0 to 65535.",
    },
  },
  storage: {
    title: "Relay storage simulator",
    description:
      "Publish several versions of an event and watch what the relay keeps on its shelf.",
    categoryLabel: "Category to simulate",
    publish: "Publish version {n}",
    publishStale: "Re-send an older copy",
    reset: "Reset",
    article: "Article",
    articleA: "Article “a”",
    articleB: "Article “b”",
    shelf: "Relay shelf",
    shelfEmpty: "The shelf is empty.",
    subscriber: "Live subscribers",
    subscriberEmpty: "Nobody has received anything yet.",
    stored: { one: "{count} event stored", other: "{count} events stored" },
    version: "v{n} · kind {kind}",
    outcomes: {
      stored: "Stored. Regular events pile up: v{n} joins the shelf.",
      replaced: "Replaced. The relay threw away the older version and kept v{n}.",
      "ignored-older":
        "Ignored. The relay already has a newer version, so this older copy is dropped.",
      forwarded: "Forwarded to live subscribers, then forgotten. Nothing is stored.",
      duplicate: "Duplicate. The relay already has this exact event id.",
    },
    demo: {
      regular: "Kind 1 note",
      replaceable: "Kind 0 profile",
      ephemeral: "Kind 24133 signer message",
      addressable: "Kind 30023 article",
    },
  },
  tool: {
    intro:
      "Search every kind we document, filter by storage category, and open any row for a live example.",
    columns: {
      kind: "Kind",
      name: "Name",
      category: "Category",
      nip: "NIP",
      details: "Details",
    },
    show: "Show",
    caption: "Event kinds and the NIPs that define them",
  },
};
