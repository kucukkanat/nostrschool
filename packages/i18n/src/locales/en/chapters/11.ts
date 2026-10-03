// Owner: chapter 11 agent. UI strings for chapter 11 (ecosystem) components.
// Adding a key? Also add it to ../../es/chapters/11.ts (English placeholder + `// TODO(es)`).
export const ch11 = {
  title: "The ecosystem",
  summary: "Relays, clients and NIPs, in numbers.",
  explorer: {
    title: "Ecosystem explorer",
    intro: "A snapshot of Nostr, counted from the protocol itself. Pick a view to dig in.",
    tabsLabel: "Ecosystem views",
    tabs: { relays: "Relays", nips: "NIPs", growth: "Growth", clients: "Clients" },
    tour: "Views explored: {done} of {total}",
    tourDone: "Tour complete! You've seen the whole ecosystem.",
    loadError: "The ecosystem snapshot could not be read: {message}",
    narration: {
      relays: "Relays view: {online} relays seen online, {software} is the most common software.",
      nips: "NIPs view: {total} NIP documents, top relay feature is {top}.",
      growth: "Growth view: NIPs grew from {from} to {to}.",
      clients: "Clients view: {count} notable clients across 4 platforms.",
    },
  },
  dataAsOf: {
    label: "Data as of {date}",
    sources: "Sources",
    status: { ok: "fresh", stale: "stale", curated: "curated" },
    sourcesLabel: "Where these numbers come from",
    notes: {
      nip66:
        "Kind 30166 events from {relays}; announced monitors only, signatures verified, last {hours}h.",
      githubHead:
        "NIP files, README list and kinds table at HEAD; growth from each file's first commit.",
      curated: "Hand-picked notable clients; not an exhaustive census.",
    },
    partial: "Partial data: {relays} stopped answering early, so a few relays may be missing.",
    stale: "The last refresh failed; these numbers come from the previous snapshot.",
  },
  stats: {
    relays: "Relays online",
    relaysHint: "seen by monitors in the last {hours}h",
    nips: "NIP documents",
    nipsHint: "{unrecommended} marked unrecommended",
    kinds: "Documented kinds",
    kindsHint: "rows in the NIPs README table",
    clients: "Notable clients",
    clientsHint: "hand-picked, not a census",
  },
  relays: {
    softwareTitle: "Which software runs relays?",
    softwareDescription: "Relays grouped by the software they report in their NIP-11 document.",
    networksTitle: "Which networks are they on?",
    networksDescription:
      "Clearnet relays use normal domains; Tor and I2P relays hide their location.",
    software: "Software",
    relays: "Relays",
    unknown: "not reported",
    other: "everything else",
    networks: { clearnet: "Clearnet", tor: "Tor", i2p: "I2P", loki: "Lokinet", other: "Other" },
    paidFact:
      "{paid} relays ask for payment and {auth} require login (NIP-42 AUTH) before you can read or write.",
    source: "Snapshot {date} · {source}",
  },
  nips: {
    title: "Which NIPs do relays support?",
    description: "Each bar counts relays that list the NIP in their supported_nips.",
    pickLabel: "Pick a NIP to see how widely relays support it",
    meterLabel: "{nip} support",
    meterValue: "{count} of {total} relays ({percent})",
    nip: "NIP",
    relays: "Relays",
    blurbs: {
      "01": "The basic protocol: events, signatures, REQ/EVENT/EOSE.",
      "02": "Follow lists (kind 3).",
      "04": "Old-style encrypted DMs, now unrecommended.",
      "09": "Deletion requests (kind 5).",
      "11": "The relay's info document (name, limits, supported NIPs).",
      "12": "Generic tag queries, since merged into NIP-01.",
      "16": "Event treatment rules, since merged into NIP-01.",
      "20": "Command results (OK), since merged into NIP-01.",
      "22": "Comments (kind 1111).",
      "33": "Parameterized replaceable events, since merged into NIP-01.",
      "40": "Expiration timestamps.",
      "42": "Authentication of clients to relays (AUTH).",
      "45": "Counting results (COUNT).",
      "50": "Search capability.",
      "70": "Protected events: only the author may publish them.",
      "77": "Negentropy syncing between relays and clients.",
      "86": "Relay management API.",
      fallback: "See the NIP text for details.",
    },
    openNip: "Read {nip}",
  },
  growth: {
    title: "How many NIPs exist over time?",
    description: "Cumulative NIP documents added to github.com/nostr-protocol/nips, per quarter.",
    seriesLabel: "NIP documents",
    xLabel: "Quarter",
    yLabel: "NIPs",
    rewindLabel: "Rewind time",
    rewindValue: "By {date}: {count} NIPs",
    rewindHint: "Drag the slider to travel through Nostr's history.",
  },
  clients: {
    title: "Find a client",
    description: "Notable apps, filtered by where you want to use Nostr.",
    platformsLabel: "Platforms",
    focusLabel: "What for?",
    allFocus: "Anything",
    platforms: { ios: "iOS", android: "Android", web: "Web", desktop: "Desktop" },
    focus: {
      social: "Social",
      chat: "Chat",
      media: "Photos & audio",
      "long-form": "Long-form",
      live: "Live streams",
      commerce: "Marketplace",
      apps: "App store",
    },
    results: {
      zero: "No clients match. Try fewer filters.",
      one: "{count} client matches.",
      other: "{count} clients match.",
    },
    visit: "Visit {name} (opens in a new tab)",
    reset: "Clear filters",
    treemapTitle: "Clients per platform",
    treemapDescription: "Each tile is one client on one platform; many apps run on several.",
    sameKeys: "Same keys, same posts, any app: switching clients never loses your followers.",
  },
  quiz: {
    q1: {
      question: "How did this chapter count the relays that are online?",
      options: {
        a: {
          label: "Every relay must register with an official Nostr directory",
          explanation: "There is no official directory: anyone can start a relay without asking.",
        },
        b: {
          label: "Monitors probe relays and publish what they find as NIP-66 events",
          explanation:
            "Yes! Kind 30166 events are relay reports, signed by monitors and read like any other event.",
        },
        c: {
          label: "Every app phones home with the relays it connects to",
          explanation:
            "Nostr apps don't report to a central server, so there's nothing to phone home to.",
        },
      },
    },
    q2: {
      question: "You switch from one Nostr app to another. What happens to your followers?",
      options: {
        a: {
          label: "They're gone: you start from zero in the new app",
          explanation: "Not on Nostr. Your follows and posts aren't locked inside an app.",
        },
        b: {
          label: "You must ask the old app to transfer your account",
          explanation: "There's no account to transfer: the app never owned it.",
        },
        c: {
          label: "Nothing: log in with the same key and everything is still there",
          explanation:
            "Right! Your identity is your key, and your posts and follow list live on relays.",
        },
      },
    },
    q3: {
      question: "What is a NIP?",
      options: {
        a: {
          label: "A spec for one feature, which apps and relays choose to support",
          explanation:
            "Exactly. That's why support varies: each relay lists the NIPs it implements.",
        },
        b: {
          label: "A paid upgrade you buy from a relay",
          explanation: "Some relays charge, but a NIP is a public spec document, free for anyone.",
        },
        c: {
          label: "A rule every app must follow or be banned",
          explanation: "Nobody can ban an app. Beyond NIP-01, every NIP is optional.",
        },
      },
    },
  },
};
