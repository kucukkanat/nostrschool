// Owner: chapter 06 agent. Adding a key here? Also add it to ../es/kinds.ts (English placeholder + `// TODO(es)`).
export const kinds = {
  categories: {
    regular: "Regular",
    replaceable: "Replaceable",
    ephemeral: "Ephemeral",
    addressable: "Addressable",
  },
  categoryDescriptions: {
    regular: "Relays keep every one.",
    replaceable: "Relays keep only the latest per author.",
    ephemeral: "Relays forward but never store them.",
    addressable: "Relays keep the latest per author and d tag.",
  },
  names: {
    k0: {
      name: "User metadata",
      description: "Profile info: name, picture, about, lud16, nip05 (JSON in content).",
    },
    k1: {
      name: "Short text note",
      description: "A plain-text post, like a tweet.",
    },
    k3: {
      name: "Follow list",
      description: "Who you follow, as p tags. Each new one replaces the last.",
    },
    k4: {
      name: "Encrypted direct message",
      description: "Deprecated NIP-04 DM: content encrypted, but who talks to whom is public.",
    },
    k5: {
      name: "Deletion request",
      description: "Asks relays and clients to delete events you published earlier.",
    },
    k6: {
      name: "Repost",
      description: "Re-shares a kind 1 note.",
    },
    k7: {
      name: "Reaction",
      description: "A like (+), dislike (-) or emoji reaction to another event.",
    },
    k8: {
      name: "Badge award",
      description: "Awards a badge to one or more people.",
    },
    k13: {
      name: "Seal",
      description: "The signed, encrypted middle layer of a gift-wrapped message.",
    },
    k14: {
      name: "Chat message",
      description: "A private message (rumor) inside a NIP-17 gift wrap.",
    },
    k16: {
      name: "Generic repost",
      description: "Re-shares any event that is not a kind 1 note.",
    },
    k20: {
      name: "Picture",
      description: "A picture-first post.",
    },
    k40: {
      name: "Channel creation",
      description: "Creates a public chat channel.",
    },
    k42: {
      name: "Channel message",
      description: "A message in a public chat channel.",
    },
    k1059: {
      name: "Gift wrap",
      description: "Outer envelope signed by a throwaway key; hides sender and timing.",
    },
    k1063: {
      name: "File metadata",
      description: "Describes a file: URL, hash, MIME type.",
    },
    k1111: {
      name: "Comment",
      description: "A threaded comment on any event or URL.",
    },
    k1311: {
      name: "Live chat message",
      description: "A chat message during a live event.",
    },
    k1984: {
      name: "Report",
      description: "Flags content or a user as spam, illegal, etc.",
    },
    k9734: {
      name: "Zap request",
      description:
        "Asks a recipient's Lightning server for an invoice; never published to relays by the sender.",
    },
    k9735: {
      name: "Zap receipt",
      description: "Published by the recipient's Lightning server once the invoice is paid.",
    },
    k9802: {
      name: "Highlight",
      description: "A highlighted passage from an article or web page.",
    },
    k10000: {
      name: "Mute list",
      description: "People, words and threads you have muted.",
    },
    k10002: {
      name: "Relay list",
      description: "Where you write and where you read: the outbox model.",
    },
    k10050: {
      name: "DM relay list",
      description: "Relays where you want to receive private messages.",
    },
    k13194: {
      name: "Wallet info",
      description: "A Nostr Wallet Connect service's capabilities.",
    },
    k22242: {
      name: "Client authentication",
      description: "Proves to a relay that you own a key (AUTH).",
    },
    k23194: {
      name: "Wallet request",
      description: "A Nostr Wallet Connect request, e.g. pay this invoice.",
    },
    k23195: {
      name: "Wallet response",
      description: "A Nostr Wallet Connect response.",
    },
    k24133: {
      name: "Nostr Connect",
      description: "Messages between an app and a remote signer (bunker).",
    },
    k27235: {
      name: "HTTP auth",
      description: "Signs an HTTP request to log in to a web service.",
    },
    k30000: {
      name: "Follow set",
      description: "A named, categorized list of people.",
    },
    k30008: {
      name: "Badge set",
      description:
        "A named set of badges. The old home of profile badges, which moved to kind 10008.",
    },
    k30009: {
      name: "Badge definition",
      description: "Defines a badge that can be awarded.",
    },
    k30023: {
      name: "Long-form article",
      description: "A blog post in Markdown; editable because it is addressable.",
    },
    k30311: {
      name: "Live event",
      description: "A live stream or event with status and participants.",
    },
    k30402: {
      name: "Classified listing",
      description: "Something for sale or wanted.",
    },
    k31922: {
      name: "Date-based calendar event",
      description: "An all-day or multi-day calendar event.",
    },
    k31923: {
      name: "Time-based calendar event",
      description: "A calendar event with a start and end time.",
    },
    k9: {
      name: "Group chat message",
      description: "A message in a relay-based group chat (NIP-C7 chats, NIP-29 groups).",
    },
    k11: {
      name: "Thread",
      description: "The opening post of a forum-style discussion thread.",
    },
    k15: {
      name: "File message",
      description: "An encrypted file shared inside a NIP-17 private conversation.",
    },
    k17: {
      name: "Website reaction",
      description: "A reaction to a website (URL) instead of a Nostr event.",
    },
    k21: {
      name: "Video",
      description: "A video-first post.",
    },
    k41: {
      name: "Channel metadata",
      description: "Updates a public chat channel's name, picture or description.",
    },
    k1040: {
      name: "OpenTimestamps attestation",
      description: "Proves an event existed at a point in time, anchored in Bitcoin.",
    },
    k1068: {
      name: "Poll",
      description: "A question with answer options people can vote on.",
    },
    k1617: {
      name: "Git patch",
      description: "A code patch for a repository published over Nostr.",
    },
    k1985: {
      name: "Label",
      description: "Attaches a label (topic, rating, category) to events, people or URLs.",
    },
    k7000: {
      name: "Job feedback",
      description: "Status updates from a data-vending machine working on a job.",
    },
    k9041: {
      name: "Zap goal",
      description: "A fundraising goal that zaps count toward.",
    },
    k10001: {
      name: "Pinned notes",
      description: "Notes you pinned to the top of your profile.",
    },
    k10003: {
      name: "Bookmarks",
      description: "Notes, articles and links you saved for later.",
    },
    k10008: {
      name: "Profile badges",
      description: "Badges you chose to display on your profile.",
    },
    k30024: {
      name: "Draft long-form article",
      description: "An unpublished draft of a long-form article.",
    },
    k30078: {
      name: "Application data",
      description: "Arbitrary per-app settings stored on relays.",
    },
    k30315: {
      name: "User status",
      description: 'What you are up to right now, like music playing or "in a meeting".',
    },
    k31989: {
      name: "Handler recommendation",
      description: "Recommends which app to use for a given kind.",
    },
    k31990: {
      name: "Handler information",
      description: "An app announcing which kinds it can open.",
    },
    k34550: {
      name: "Community definition",
      description: "Defines a moderated community and its moderators.",
    },
  },
};
