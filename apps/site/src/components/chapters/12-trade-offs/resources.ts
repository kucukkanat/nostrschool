/** Next-steps links for the course finale. Labels live in i18n; only targets live here. */

export const TOOL_LINKS = [
  { id: "keys", path: "tools/keys" },
  { id: "inspector", path: "tools/event-inspector" },
  { id: "filters", path: "tools/filter-playground" },
  { id: "kinds", path: "tools/kinds" },
  { id: "glossary", path: "glossary" },
] as const;

export const RESOURCE_LINKS = [
  { id: "nips", url: "https://github.com/nostr-protocol/nips" },
  { id: "nostrTools", url: "https://github.com/nbd-wtf/nostr-tools" },
  { id: "nostrCom", url: "https://nostr.com" },
  { id: "nostrHow", url: "https://nostr.how" },
  { id: "awesome", url: "https://github.com/aljazceru/awesome-nostr" },
] as const;
