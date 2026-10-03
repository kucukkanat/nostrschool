// Owner: chapter 05 agent. UI strings for chapter 05 (filters) components.
// Adding a key? Also add it to ../../es/chapters/05.ts (English placeholder + `// TODO(es)`).
export const ch05 = {
  title: "Filters",
  summary: "Ask relays for exactly the events you want.",
  describe: {
    everything: "An empty filter: give me everything you have!",
    newestOnly: "Give me the newest {limit} events, whatever they are.",
    or: " or ",
    and: ", ",
    fields: {
      ids: "with id {values}",
      authors: "written by {values}",
      kinds: "of kind {values}",
      "#e": "pointing at event {values}",
      "#p": "mentioning {values}",
      "#t": "tagged {values}",
    },
    since: "from {date} on",
    until: "up to {date}",
    sentence: "Give me events {body}.",
    sentenceLimited: "Give me the newest {limit} events {body}.",
  },
  preview: {
    profile: "Profile: name, picture, bio",
    follows: "Follow list ({count} people)",
    deletion: "Deletion request",
    repost: "Repost of another note",
    giftWrap: "Sealed private message (unreadable)",
    zapReceipt: "Zap receipt from a Lightning wallet",
    relayList: "Relay list ({count} relays)",
    article: "Long-form article",
  },
  builder: {
    title: "Filter builder",
    description:
      "Flip the switches and watch the relay's shelf: matching events light up, everything else fades.",
    controlsLabel: "Filter fields",
    presetsLabel: "Try a recipe",
    presets: {
      aliceNotes: "Alice's notes",
      thread: "Alice's thread",
      mentionsBob: "Mentions of Bob",
      hashtag: "#nostr",
      newest: "Newest 5",
    },
    reset: "Clear filter",
    add: "Add",
    remove: "Remove {value}",
    quickPicks: "Quick picks for {field}",
    fields: {
      ids: {
        label: "ids",
        hint: "Exact event ids (hex or note1…). Tip: pick a card and pin its id.",
        placeholder: "64-char hex or note1…",
      },
      authors: {
        label: "authors",
        hint: "Who signed the event (hex pubkey or npub1…).",
        placeholder: "hex pubkey or npub1…",
      },
      kinds: {
        label: "kinds",
        hint: "What sort of event: 1 = note, 7 = reaction, 0 = profile…",
        placeholder: "e.g. 1",
      },
      "#e": {
        label: "#e",
        hint: "Events with an e tag pointing at this event: replies, reactions, reposts.",
        placeholder: "event id or note1…",
      },
      "#p": {
        label: "#p",
        hint: "Events with a p tag mentioning this person.",
        placeholder: "hex pubkey or npub1…",
      },
      "#t": {
        label: "#t",
        hint: "Hashtags (t tags), lowercase, without the #.",
        placeholder: "e.g. nostr",
      },
    },
    numbers: {
      since: { label: "since", toggle: "Only events from this moment on" },
      until: { label: "until", toggle: "Only events up to this moment" },
      limit: { label: "limit", toggle: "Only the newest N events" },
    },
    errors: {
      empty: "Type something first.",
      "invalid-id": "That's not an event id. Use 64 hex characters, a note1… or an nevent1….",
      "invalid-pubkey":
        "That's not a public key. Use 64 hex characters, an npub1… or an nprofile1….",
      "not-an-integer": "Kinds are whole numbers, like 1 or 30023.",
      "out-of-range": "Kinds go from 0 to 65535.",
      "invalid-hashtag": "A hashtag is a single word, like nostr.",
      duplicate: "Already in the filter.",
    },
    jsonTitle: "The filter, as JSON",
    reqTitle: "…wrapped in a REQ message",
    shelfLabel: "Events on our sample relay",
    results: {
      zero: "No events match. Loosen a condition!",
      one: "{count} of {total} events match",
      other: "{count} of {total} events match",
    },
    limited: {
      one: "{count} more matches but is cut by the limit",
      other: "{count} more match but are cut by the limit",
    },
    states: {
      match: "match",
      limited: "cut by limit",
      miss: "no match",
    },
    cardLabel: "{author}, {kind}, {time}: {state}. Show why.",
    unknownAuthor: "Someone else",
  },
  explain: {
    title: "Why this event?",
    prompt: "Pick any card to see which conditions it passes.",
    empty: "The filter is empty, so every event passes. Add a condition!",
    pass: "passes",
    fail: "fails",
    verdictMatch: "Every condition passes, so the relay sends it.",
    verdictLimited: "It matches, but newer events already filled the limit.",
    verdictMiss: "One failing condition is enough to leave it out.",
    pinId: "Filter by this id",
    findTagged: "Find events pointing here (#e)",
    findAuthor: "More from this author",
    close: "Close",
  },
  quest: {
    title: "Filter quests",
    description:
      "Build a filter whose results are exactly what each quest asks for. Any filter that gets there counts!",
    progress: "{count} of {total} quests solved",
    solved: "Solved!",
    solvedAnnounce: "Quest solved: {title}",
    allSolved: "All quests solved. You speak fluent relay!",
    items: {
      reactions: {
        title: "Applause meter",
        goal: "Find every reaction (kind 7) to Alice's relay thread, and nothing else.",
      },
      hotTake: {
        title: "Hot take hunt",
        goal: "Find Bob's short notes tagged #nostr.",
      },
      profiles: {
        title: "Fresh faces",
        goal: "Get only the 3 newest profiles (kind 0).",
      },
      aliceToday: {
        title: "New Year's Eve",
        goal: "Everything Alice signed from 31 Dec 2024, 00:00 UTC onward.",
      },
    },
  },
  runner: {
    title: "Send it to a relay",
    description:
      "Wrap the filter in a REQ and watch the real conversation: events stream in, then EOSE says 'that's all I have stored'.",
    send: "Send REQ",
    stop: "Close subscription",
    modeFixture: "Sample relays",
    modeLive: "Live relays",
    safeLimit: "Live relays get a limit of {limit} so we stay polite.",
    framesTitle: "Wire log",
    framesEmpty: "Nothing sent yet.",
    results: {
      zero: "No events came back.",
      one: "{count} event received",
      other: "{count} events received",
    },
    running: "Waiting for relays…",
    done: "All relays sent EOSE.",
    closed: "Subscription closed.",
    error: "{relay}: {message}",
    from: "via {relay}",
  },
  editor: {
    label: "Edit the filter JSON",
    apply: "Apply JSON",
    applied: "Filter updated from JSON.",
    errors: {
      "invalid-json": "That isn't valid JSON: {message}",
      "invalid-filter": "Not a valid filter: {message}",
      "unsupported-field":
        "The builder only shows ids, authors, kinds, #e, #p, #t, since, until and limit ({message}).",
    },
  },
  tool: {
    intro:
      "Build NIP-01 filters visually, see them as JSON, test them against sample events or, with live mode on, real relays.",
  },
};
