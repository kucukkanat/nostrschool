/**
 * Everyday words people search with that the NIP text never uses ("send sats" for NIP-57, "DM"
 * for NIP-17). A small sentence model cannot learn Nostr jargon, so these hints are indexed
 * lexically AND appended to each NIP's "about" passage before embedding. Search-only data: never
 * shown in the UI, not i18n text. The model is English-only, so Spanish everyday words live in
 * NIP_SEARCH_HINTS_ES and are indexed lexically only (never embedded).
 * Keep entries short and true to the NIP; re-run `bun run embed:nips` after editing.
 */
import type { NipId } from "@nostrschool/nips";

export const NIP_SEARCH_HINTS: { readonly [id: NipId]: readonly string[] } = {
  "01": [
    "basic protocol",
    "events",
    "relays",
    "subscriptions",
    "profile metadata",
    "profile name and picture",
    "text note",
  ],
  "02": ["follow list", "following", "contacts"],
  "04": ["old direct messages", "encrypted DM"],
  "03": ["timestamp proof", "opentimestamps", "bitcoin timestamp"],
  "05": ["verified username", "domain verification", "nostr address", "internet identifier"],
  "06": ["seed phrase", "mnemonic", "recover keys", "BIP39"],
  "07": ["browser extension", "login with extension", "sign in", "signer extension"],
  "09": ["delete a note", "remove a post", "unpublish"],
  "10": ["replies", "threads", "conversation"],
  "11": ["relay info", "relay metadata", "relay limits"],
  "13": ["proof of work", "spam protection", "mining"],
  "17": ["private messages", "DMs", "direct messages", "private chat"],
  "18": ["repost", "boost", "share a note", "quote"],
  "19": [
    "npub",
    "nsec",
    "shareable identifiers",
    "bech32",
    "public key format",
    "key encoding",
    "nprofile",
    "nevent",
    "naddr",
  ],
  "23": ["blog posts", "long-form articles", "markdown"],
  "24": ["hashtags", "t tag", "profile fields", "display name", "banner"],
  "25": ["likes", "reactions", "emoji reaction", "like", "like a note"],
  "28": ["public chat rooms", "channels"],
  "29": ["group chat", "communities", "closed groups"],
  "36": ["nsfw", "content warning", "spoiler"],
  "42": ["relay login", "relay authentication"],
  "44": ["encryption", "encrypt payloads"],
  "46": [
    "remote signer",
    "bunker",
    "nsec bunker",
    "sign in with a signer app",
    "nostrconnect",
    "bunker://",
  ],
  "47": ["wallet connect", "lightning wallet", "pay invoices", "NWC"],
  "50": ["search", "full text search"],
  "51": ["mute list", "bookmarks", "lists", "pinned notes"],
  "52": ["calendar", "meetings", "appointments"],
  "53": ["live streaming", "live events", "spaces"],
  "56": ["report", "flag content", "moderation"],
  "57": ["send sats", "tip", "zap", "lightning payment", "pay for a post"],
  "58": ["badges", "achievements"],
  "59": ["gift wrap", "hide metadata", "sealed messages"],
  "60": ["ecash wallet", "cashu"],
  "61": ["nutzaps", "ecash tips"],
  "62": ["delete my account", "erase all my data"],
  "65": ["outbox model", "relay list", "where a user writes and reads"],
  "68": ["picture posts", "photos", "image feed"],
  "71": ["video posts"],
  "72": ["moderated communities", "reddit-like communities"],
  "88": ["polls", "voting"],
  "92": ["attach pictures", "image attachments", "imeta"],
  "90": ["data vending machines", "jobs", "AI tasks"],
  "94": ["file metadata"],
  "96": ["file upload", "media hosting", "image upload"],
  "98": ["HTTP auth", "API authentication"],
  "99": ["classified listings", "marketplace", "sell things"],
  "5A": ["host a website", "static site", "nsite"],
  "7D": ["forum", "discussion threads"],
  B7: ["blossom", "media storage", "file upload"],
  C7: ["chats", "simple chat messages"],
  EE: ["MLS", "end-to-end encrypted group messaging"],
};

/**
 * Spanish phrasings the Spanish titles/summaries do not contain ("borrar mi nota"). Lexical only:
 * the English model would only add noise for them.
 */
export const NIP_SEARCH_HINTS_ES: { readonly [id: NipId]: readonly string[] } = {
  "02": ["seguir", "seguidos", "a quién sigo"],
  "09": ["borrar", "eliminar", "borrar nota"],
  "25": ["me gusta"],
  "36": ["nsfw"],
  "56": ["denunciar", "reportar", "denunciar contenido"],
  "96": ["subir", "subir archivos"],
  B7: ["subir", "subir archivos"],
};

/** English hints: embedded AND indexed lexically. */
export const searchHints = (id: NipId): readonly string[] => NIP_SEARCH_HINTS[id] ?? [];

/** Extra lexical-only hints for a non-English locale ([] for "en"). */
export const searchHintsFor = (locale: string, id: NipId): readonly string[] =>
  locale === "es" ? (NIP_SEARCH_HINTS_ES[id] ?? []) : [];
