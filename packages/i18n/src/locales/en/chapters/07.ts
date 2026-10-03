// Owner: chapter 07 agent. UI strings for chapter 07 (social-graph) components.
// Adding a key? Also add it to ../../es/chapters/07.ts (English placeholder + `// TODO(es)`).
export const ch07 = {
  title: "The social graph",
  summary: "Follow lists, and how clients find where your friends publish.",
  graph: {
    title: "Who follows whom",
    description:
      "Seven people and their kind 3 follow lists, drawn as a force-directed graph. Drag people around, hover to light up connections, select someone to read their list.",
    lensLabel: "When hovering, highlight",
    lensFollows: "Who they follow",
    lensFollowers: "Who follows them",
    statsTitle: "The whole network",
    stats: "{people} people · {links} follows · {mutual} mutual pairs",
    popular: "Most followed: {name} ({count} followers)",
    pickHint: "Select someone in the graph (click, or Tab then Enter) to read their follow list.",
    follows: "Follows · {count}",
    followers: "Followed by · {count}",
    mutualBadge: "mutual",
    none: "Nobody",
    clear: "Clear selection",
    rawTitle: "{name}'s latest kind 3 event",
    hoverFollows: "{name} follows {list}.",
    hoverFollowers: "{name} is followed by {list}.",
  },
  outbox: {
    title: "How does an app find your friends' notes?",
    description:
      "An animated map of a Nostr app talking to four relays. Pick a strategy and step through it to see which relays the app contacts and whose notes arrive.",
    viewerLabel: "You are",
    modeLabel: "Strategy",
    modes: {
      outbox: "Outbox model",
      reply: "Reply to a friend",
      single: "Everyone on one relay",
    },
    singleRelayLabel: "The one relay",
    recipientLabel: "Replying to",
    app: "{name}'s app",
    lookups: "profile lookups",
    steps: {
      start: "Ready",
      follows: "Load follow list",
      relayLists: "Fetch relay lists",
      plan: "Plan connections",
      subscribe: "Subscribe",
      notes: "Notes arrive",
      lookup: "Find their inbox",
      publish: "Publish reply",
    },
    narration: {
      start: "Press play or step forward to watch {name}'s app work.",
      follows: "{name}'s app asks {relay} for {name}'s kind 3 follow list: {list}.",
      relayLists:
        "Next it asks {relay} for every followed person's kind 10002 relay list, to learn where each one writes.",
      plan: "It groups people by the relays they write to: {count} relays to visit. ({minimal} would already reach everyone once.)",
      subscribe:
        "It opens one subscription per relay, asking each relay only for the authors who write there.",
      notesAll: "Notes from all {total} people arrive. Nobody is missing!",
      singleFollows:
        "{name}'s app only knows {relay}, so it loads the follow list from there: {list}.",
      singleSubscribe: "It asks {relay} for everyone's notes in one subscription.",
      notesSome:
        "Only {reached} of {total} people show up. Missing: {missed}. They never write to {relay}.",
      lookup:
        "To reply to {recipient}, the app fetches {recipient}'s kind 10002 to find their read relays: their inbox.",
      publish:
        "It sends the reply to {name}'s write relays (so followers see it) and to {recipient}'s read relays (so {recipient} sees it): {relays}.",
    },
    coverage: "{reached}/{total} reached",
    connections: "Relays contacted: {count}",
    minimal: "Fewest relays that reach everyone: {count}",
    relayAsks: "Asks for: {list}",
    relayIdle: "Not needed",
    relayPublish: "Receives the reply",
    legendWrite: "writes to",
    legendRead: "inbox (read)",
    legendLink: "app connection",
    personReached: "{name}: notes arrived",
    personMissed: "{name}: missing",
    personWaiting: "{name}",
    framesTitle: "What the app actually sends",
    framesEmpty: "Step forward to see the messages.",
    replyContent: "Love this, {name}!",
  },
  replace: {
    title: "The kind 3 overwrite trap",
    description:
      "A follow list is replaceable: the relay keeps only the newest copy. Edit Grace's list, publish it, then publish from an out-of-date tablet and see what survives.",
    intro: "You are Grace. Tick who to follow, then publish from your phone.",
    followLabel: "Grace's phone",
    publishPhone: "Publish from phone",
    publishTablet: "Publish from old tablet",
    sync: "Sync phone from relay",
    reset: "Start over",
    tabletHint: "The tablet still has a list from last month: only {list}.",
    relayTitle: "On the relay",
    relayEmpty: "Nothing published yet in this demo.",
    version: "Version {n} · {device} · {count} follows",
    devicePhone: "phone",
    deviceTablet: "tablet",
    lost: "Lost follows: {list}",
    narration: {
      ready: "Change the checkboxes, then publish.",
      published:
        "The phone published version {n} with {count} follows. The relay threw the older list away.",
      tablet:
        "The old tablet published version {n}. It is newer, so it replaced everything. Lost: {lost}.",
      tabletNoLoss: "The old tablet published version {n}. Luckily it lists everyone you follow.",
      synced:
        "The phone downloaded the newest list from the relay before editing. That's the safe habit.",
      reset: "Back to the start.",
    },
    eventTitle: "Newest kind 3 the relay keeps",
  },
  quiz: {
    q1: {
      question: "Bob follows Alice. Where is that fact stored?",
      options: {
        a: {
          label: "In a follower list on Alice's relay.",
          explanation:
            "Nobody keeps a follower list for Alice: followers are counted by searching.",
        },
        b: {
          label: "As a p tag in Bob's own signed kind 3 event.",
          explanation: "Right: a follow is a line in the follower's own list, signed by them.",
        },
        c: {
          label: "In a central Nostr database.",
          explanation: "There is no central database: just signed events on relays.",
        },
      },
    },
    q2: {
      question: "Your app wants Carol's notes. Following NIP-65, which relays should it ask?",
      options: {
        a: {
          label: "Carol's write relays from her kind 10002.",
          explanation: "Yes: read an author from where they write (their outbox).",
        },
        b: {
          label: "Carol's read relays.",
          explanation: "Read relays are Carol's inbox: where others send things to her.",
        },
        c: {
          label: "Whatever relay your app was installed with.",
          explanation: "That's the one-relay trap: anyone who doesn't write there goes missing.",
        },
      },
    },
    q3: {
      question:
        "An old tablet publishes a kind 3 with fewer follows than your phone's. What happens?",
      options: {
        a: {
          label: "The relay merges both lists.",
          explanation: "Relays don't merge: a replaceable event is swapped out whole.",
        },
        b: {
          label: "The relay rejects it because it's shorter.",
          explanation: "Relays don't judge contents: newer wins.",
        },
        c: {
          label: "It replaces the old list, and the missing follows are gone.",
          explanation: "Correct: always fetch the latest list before editing it.",
        },
      },
    },
  },
};
