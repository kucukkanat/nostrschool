// Owner: spec author r2 (NIPs 20–39). Adding a key? Also add it to ../../es/nips/r2.ts
// (English text + `// TODO(es)`). `text` holds every TextKey the NIP's spec references.
import type { NipStringsRange } from "../../../nips.ts";

export const r2 = {
  n20: {
    title: "Command Results",
    summary:
      "Deprecated: now part of NIP-01. Defined the OK message a relay sends back after you publish an event, saying whether it was stored and, if not, why.",
    text: {
      "how.moved.title": "This NIP now lives in NIP-01",
      "how.moved.body":
        "NIP-20 was folded into NIP-01, so every relay is expected to answer with OK. Read NIP-01 for the current rules; this page keeps the walkthrough for old links.",
      "how.send.title": "The client publishes an event",
      "how.send.body":
        'The client sends ["EVENT", <event>] to the relay. Before NIP-20 it had no way to know if the relay kept the event.',
      "how.ok.title": "The relay answers with OK",
      "how.ok.body":
        "The relay replies with the event id and true or false. true means stored (or already stored); false means rejected.",
      "how.prefix.title": "A machine-readable reason",
      "how.prefix.body":
        'The last element is a message. When it starts with a known prefix such as "blocked:", "rate-limited:" or "auth-required:", a client can react automatically, for example by logging in or waiting.',
      "related.01": "The OK message and its prefixes are now defined in NIP-01.",
      "related.42":
        'NIP-42 adds the "auth-required:" prefix for relays that need you to log in first.',
      "related.13": 'NIP-13 proof of work is what the "pow:" prefix is about.',
      "msg.ok.label": "OK (command result)",
      "msg.ok.explain":
        "Sent by a relay in answer to every EVENT a client publishes, so the client knows whether the event was accepted.",
      "msg.ok.event-id":
        "The id of the event this result is about, copied from the EVENT the client sent.",
      "msg.ok.accepted":
        "true if the relay stored the event (or already had it), false if it refused it.",
      "msg.ok.message":
        'Human-readable text for the user. When the event is refused it should start with a prefix like "invalid:", "pow:", "blocked:", "rate-limited:", "restricted:", "mute:", "error:" or "auth-required:", followed by a space. It may be empty when the event is accepted.',
      "example.accepted": "Accepted",
      "example.duplicate": "Already stored",
      "example.duplicate.explain":
        'A duplicate is still a success (true); the "duplicate:" prefix just tells the client nothing new happened.',
      "example.blocked": "Refused by policy",
      "example.blocked.explain":
        "A paid relay refusing a non-member. false plus the blocked: prefix tells the client to try another relay.",
      "actor.client": "Client",
      "actor.relay": "Relay",
      "step.event.label": "EVENT",
      "step.event.explain": "Alice's client publishes a signed note to the relay.",
      "step.check.label": "Validate and apply policy",
      "step.check.explain":
        "The relay checks the id and signature, then its own rules: size limits, spam filters, membership, proof of work.",
      "step.ok-true.label": "OK true",
      "step.ok-true.explain": "Stored. The client can mark the note as published on this relay.",
      "step.ok-false.label": "OK false",
      "step.ok-false.explain":
        "Refused, with a prefixed reason. Here the client is sending too fast and should back off and retry later.",
    },
  },
  n21: {
    title: "nostr: URI scheme",
    summary:
      'Put "nostr:" in front of a NIP-19 code (npub, nprofile, note, nevent, naddr) and you get a link any Nostr app can open, inside notes, on web pages or in QR codes.',
    text: {
      "how.entity.title": "Start from a NIP-19 code",
      "how.entity.body":
        "Pick what you want to point at: a profile (npub, nprofile), a note (note, nevent) or an addressable event such as an article (naddr).",
      "how.prefix.title": 'Add the "nostr:" scheme',
      "how.prefix.body":
        'The URI is just "nostr:" followed by the code, with nothing in between. There are no slashes and no query string.',
      "how.no-nsec.title": "Never for secret keys",
      "how.no-nsec.body":
        "Any NIP-19 code works except nsec. A link is meant to be shared, and sharing your secret key gives away your identity.",
      "how.open.title": "Apps open it",
      "how.open.body":
        "The operating system hands nostr: links to an installed Nostr app. Inside a note, clients turn them into mentions or previews (that is NIP-27).",
      "how.html.title": "Linking web pages to Nostr",
      "how.html.body":
        'A web page can say "this is also on Nostr" with <link rel="alternate" href="nostr:naddr1…">, or name its author with rel="me" or rel="author" pointing at an nprofile.',
      "related.19": "The codes after nostr: are exactly the NIP-19 bech32 entities.",
      "related.27": "NIP-27 uses nostr: URIs to mention profiles and notes inside a note's text.",
      "related.23": "Articles (kind 30023) are usually linked with nostr:naddr URIs.",
      "enc.uri.label": "nostr: URI",
      "enc.uri.explain":
        "Turns a NIP-19 code into a clickable link that any Nostr client or operating system handler understands.",
      "enc.uri.entity":
        "A NIP-19 code: npub, nprofile, note, nevent or naddr. nsec is not allowed.",
      "enc.uri.output":
        'The output is "nostr:" followed by the unchanged code. Decoding is the reverse: strip "nostr:" and decode the NIP-19 part.',
      "example.npub": "Alice's profile",
      "example.nevent": "Erin's note, with a relay hint",
      "example.nevent.explain":
        "nevent carries the note id plus a relay where it can be found, the author and the kind, so apps can fetch it quickly.",
      "example.naddr": "Frank's article",
      "example.naddr.explain":
        "naddr points at an addressable event by kind, author and d tag, so the link keeps working after the article is edited.",
    },
  },
  n22: {
    title: "Comment",
    summary:
      "Kind 1111 comments: a reply thread you can hang off anything, an article, a file, a podcast episode or a plain web URL, using upper-case tags for the root and lower-case tags for the parent.",
    text: {
      "rule.root":
        "A comment must name its root with one of E (event id), A (address) or I (external id).",
      "rule.parent":
        "A comment must name its parent with one of e (event id), a (address) or i (external id); for a top-level comment the parent is the root.",
      "how.root.title": "Point at the root with upper-case tags",
      "how.root.body":
        "Every comment names the thing the whole thread is about: E for an event id, A for an addressable event, or I for something outside Nostr such as a URL. P names the root's author.",
      "how.parent.title": "Point at the parent with lower-case tags",
      "how.parent.body":
        "e, a or i name what you are directly answering, and p its author. For a top-level comment the parent is the root itself, so the same values appear twice.",
      "how.kinds.title": "Always say the kinds",
      "how.kinds.body":
        'K and k are required: the kind of the root and of the parent ("30023" for an article, "1111" when replying to a comment, or a NIP-73 type like "web"). Every comment needs exactly one root tag (E, A or I) and one parent tag (e, a or i). Kind 1 notes are off limits: reply to those with NIP-10 instead.',
      "how.external.title": "Comment on the outside world",
      "how.external.body":
        'With I and i tags (NIP-73) you can comment on a web page, a podcast episode, a book ISBN or a hashtag. K is then the identifier type, such as "web".',
      "how.plain.title": "Plain text only",
      "how.plain.body":
        "The content is plain text: no HTML and no Markdown. Mentions use nostr: URIs (NIP-21) with optional q and p tags.",
      "related.10":
        "NIP-10 threads kind 1 notes; NIP-22 is the threading model for everything else.",
      "related.73": "NIP-73 defines the external identifiers used in I/i tags and their K/k types.",
      "related.23": "Replies to long-form articles must be NIP-22 comments.",
      "related.21": "Quotes and mentions inside the comment are nostr: URIs.",
      "event.comment.label": "Comment (kind 1111)",
      "event.comment.explain":
        "A plain-text comment scoped to a root (event, address or external id) and a parent item.",
      content: "The comment text. Plain text: no HTML, no Markdown formatting.",
      "tag.relay": "Optional relay URL where the referenced event can be found.",
      "tag.root.e": "Root is a regular event: its id. Use one of E, A or I.",
      "tag.root.e.id": "Id of the event at the root of the thread.",
      "tag.root.e.pubkey":
        "Optional author pubkey of the root event, so clients can find it on the author's relays.",
      "tag.root.a":
        "Root is an addressable event (an article, a repository…): its kind:pubkey:d address.",
      "tag.root.a.addr": "Address of the root event as kind:pubkey:d-tag.",
      "tag.root.i": "Root is something outside Nostr: a NIP-73 identifier such as a URL.",
      "tag.i.value":
        'A NIP-73 external identifier: a URL, "podcast:item:guid:…", "isbn:…", "#hashtag" and so on.',
      "tag.i.hint": "Optional web page where the external item can be seen.",
      "tag.root.k":
        'Kind of the root item: a kind number like "30023", or a NIP-73 type like "web". Required.',
      "tag.k.value":
        'A kind number as text ("30023", "1111") or a NIP-73 identifier type ("web", "podcast:item:guid"). Never "1": kind 1 notes are answered with NIP-10 replies, not comments.',
      "tag.root.p": "Author of the root event, so they get notified.",
      "tag.root.p.pubkey": "Pubkey of the root event's author.",
      "tag.parent.e": "Parent is a regular event (often another comment): its id.",
      "tag.parent.e.id": "Id of the event you are replying to directly.",
      "tag.parent.e.pubkey": "Optional author pubkey of the parent event.",
      "tag.parent.a": "Parent is an addressable event. Add an e tag with its current id as well.",
      "tag.parent.a.addr": "Address of the parent event as kind:pubkey:d-tag.",
      "tag.parent.i": "Parent is an external item (same value as I for a top-level comment).",
      "tag.parent.k":
        'Kind of the parent item. "1111" when you reply to another comment. Required.',
      "tag.parent.p": "Author of the parent item, so they get notified of the reply.",
      "tag.parent.p.pubkey": "Pubkey of the parent item's author.",
      "tag.q": "Quote: an event or address cited in the content with a nostr: URI.",
      "tag.q.target": "Event id (64 hex) or address (kind:pubkey:d) being quoted.",
      "tag.q.pubkey": "Author of the quoted event, when it is a regular event.",
      "example.on-article": "Comment on an article",
      "example.on-article.explain":
        "Carol comments on Frank's article. Top-level, so root (A, K, P) and parent (a, k, p) are the same article, plus an e tag with the article's current id.",
      "example.reply": "Reply to a comment",
      "example.reply.explain":
        'Frank answers Carol. The root still points at the article; the parent is Carol\'s comment, so k is "1111".',
      "example.on-url": "Comment on a web page",
      "example.on-url.explain":
        'Grace comments on a URL. I and i hold the URL, and K and k are "web". No P or p: there is no Nostr author to notify.',
    },
  },
  n23: {
    title: "Long-form Content",
    summary:
      "Articles and blog posts as kind 30023: Markdown content plus title, summary, image and hashtag tags. Each article has a d tag, so you can edit it and links keep pointing at the latest version.",
    text: {
      "how.markdown.title": "Write in Markdown",
      "how.markdown.body":
        "The content is Markdown. Don't hard-wrap paragraphs at 80 columns and don't embed HTML, so every client can render it the same way.",
      "how.d.title": "Give it a d tag",
      "how.d.body":
        "kind 30023 is addressable: the d tag is the article's slug. Publishing again with the same d replaces the old version on relays, which is how editing works.",
      "how.meta.title": "Add optional metadata",
      "how.meta.body":
        "title, summary and image tags let clients show a card without parsing the Markdown. t tags add lowercase hashtags.",
      "how.dates.title": "Two dates",
      "how.dates.body":
        "created_at is when this version was saved (the last edit). published_at keeps the date the article first came out, so edits don't make it look new.",
      "how.link.title": "Link to it with naddr",
      "how.link.body":
        "Share an article as a NIP-19 naddr (kind + author + d), or reference it from other events with an a tag. Mentions inside the text follow NIP-27.",
      "how.drafts.title": "Drafts and replies",
      "how.drafts.body":
        "The old kind 30024 for drafts is deprecated: store drafts with NIP-37 instead. Replies to an article are NIP-22 kind 1111 comments, not kind 1 notes.",
      "related.01": "Addressable events (kind:pubkey:d replacement) are defined in NIP-01.",
      "related.19": "naddr is the NIP-19 code used to share an article.",
      "related.27": "References inside the article use nostr: links as described in NIP-27.",
      "related.22": "Comments on an article are NIP-22 kind 1111 events.",
      "related.37": "NIP-37 draft wraps replace the deprecated kind 30024 drafts.",
      "event.article.label": "Article (kind 30023)",
      "event.article.explain":
        "A long-form, editable post. The latest version for each author + d tag is the one clients show.",
      content: "The article body in Markdown. No hard line breaks inside paragraphs and no HTML.",
      "tag.d": "Identifier of the article for this author. Same d = same article, newer version.",
      "tag.d.value": 'A stable slug such as "how-relays-work". Keep it when editing.',
      "tag.title": "The article title.",
      "tag.title.value": "Title shown above the article and in previews.",
      "tag.summary": "A short summary for previews and feeds.",
      "tag.summary.value": "One or two sentences describing the article.",
      "tag.published_at": "When the article was first published.",
      "tag.published_at.value":
        "Unix timestamp in seconds, as a string. Stays the same across edits, unlike created_at.",
      "tag.image": "A header image shown with the title.",
      "tag.image.value": "URL of the image.",
      "tag.t": "A hashtag (topic) for discovery.",
      "tag.t.value": 'Lowercase topic without the #, for example "relays".',
      "tag.e": "A note referenced in the article.",
      "tag.e.id": "Id of the referenced event.",
      "tag.relay": "Optional relay where the referenced item can be found.",
      "tag.a": "Another addressable event (often another article) referenced in the text.",
      "tag.a.addr": "Address as kind:pubkey:d-tag.",
      "tag.p": "A profile mentioned in the article, so they are notified.",
      "tag.p.pubkey": "Pubkey of the mentioned person.",
      "example.essay": "Frank's essay",
      "example.essay.explain":
        "A real-shaped article: d slug, title, summary, a published_at older than created_at (it was edited later), and two hashtags.",
      "example.with-refs": "Article with references",
      "example.with-refs.explain":
        "Alice links Bob's note and Frank's article with nostr: URIs, and adds matching e and a tags so their authors' clients can show the mention.",
      "event.draft.label": "Draft (kind 30024, deprecated)",
      "event.draft.explain":
        "The old way to keep an unpublished article: the same tags as kind 30023, with the Markdown encrypted to yourself using NIP-04. Still found on relays, but new apps should save drafts with NIP-37.",
      "draft.content":
        "The draft body, NIP-04 encrypted from the author to the author's own pubkey, so only they can read it.",
      "draft.plaintext": "What decrypts out: the article Markdown, exactly as in a kind 30023.",
      "example.draft": "Frank's draft (deprecated)",
      "example.draft.explain":
        "Frank saves a half-written article. Only the d tag is public; the text is encrypted to his own key. Today he would use a NIP-37 draft wrap instead.",
    },
  },
  n24: {
    title: "Extra metadata fields and tags",
    summary:
      "A catalogue of widely used extras that no other NIP owns: profile fields like display_name, website, banner, bot and birthday, plus the generic r, i, title and t tags.",
    text: {
      "how.display-name.title": "name and display_name",
      "how.display-name.body":
        "name is the short handle and should always be set. display_name is a longer name that can use any characters and emoji.",
      "how.extras.title": "More profile fields",
      "how.extras.body":
        "website, banner (a wide header image) and birthday are optional. bot: true tells readers the account is fully or partly automated.",
      "how.deprecated.title": "Fields to stop using",
      "how.deprecated.body":
        "displayName and username are old spellings: write display_name and name instead. The relay map that used to sit in kind 3 content is replaced by the NIP-65 relay list.",
      "how.tags.title": "Tags that mean the same everywhere",
      "how.tags.body":
        "Unless a more specific NIP says otherwise, r is a URL the event refers to, i an external id (NIP-73), title a name for lists and listings, and t a lowercase hashtag.",
      "related.01": "Kind 0 profile metadata is defined in NIP-01; NIP-24 adds fields to it.",
      "related.02": "Kind 3 follow lists are defined in NIP-02.",
      "related.65": "NIP-65 kind 10002 relay lists replace the relay map in kind 3 content.",
      "related.73": "The i tag carries NIP-73 external content ids.",
      "event.profile.label": "Profile metadata (kind 0)",
      "event.profile.explain": "Your public profile, with the extra fields NIP-24 standardises.",
      "content.profile": "Stringified JSON object with the profile fields.",
      "schema.profile":
        "Profile fields. Unknown fields are allowed; clients ignore what they don't know.",
      "field.name": "Short name or handle. Always set it, even when display_name is present.",
      "field.display_name": "A longer, richer display name. Can include spaces and emoji.",
      "field.about": "A short bio.",
      "field.picture": "URL of the avatar image.",
      "field.website": "A web page related to the author.",
      "field.banner": "URL of a wide (about 1024×768) image shown behind the profile header.",
      "field.bot":
        "true if the account's content is fully or partly automated (a feed, a chatbot).",
      "field.birthday": "Birth date as an object. Each of year, month and day may be left out.",
      "field.birthday.year": "Year, for example 1990.",
      "field.birthday.month": "Month from 1 to 12.",
      "field.birthday.day": "Day of the month from 1 to 31.",
      "field.displayName": "Deprecated spelling: use display_name.",
      "field.username": "Deprecated: use name.",
      "event.contacts-relays.label": "Follow list relay map (kind 3, deprecated)",
      "event.contacts-relays.explain":
        "Old clients stored the user's relays in the content of the kind 3 follow list. Shown here so you can recognise it; publish a NIP-65 relay list instead.",
      "content.contacts-relays":
        "Deprecated: a JSON object mapping relay URLs to read/write flags.",
      "schema.contacts-relays": "Relay URL → { read, write }. Deprecated in favour of NIP-65.",
      "schema.contacts-relays.entry": "How this relay is used.",
      "field.read": "true if the user reads from this relay.",
      "field.write": "true if the user publishes to this relay.",
      "tag.p": "A followed profile (NIP-02).",
      "tag.p.pubkey": "Pubkey of the followed person.",
      "tag.p.petname": "Optional local nickname for this person.",
      "tag.relay": "Optional relay where this person publishes.",
      "event.tags.label": "Generic tags (any kind)",
      "event.tags.explain":
        "Tags with a shared meaning on any event kind, unless a more specific NIP defines them differently.",
      "content.tags": "The event's own content; NIP-24 says nothing about it.",
      "tag.r": "A web URL the event refers to.",
      "tag.r.url": "The URL.",
      "tag.i": "An external identifier the event refers to (NIP-73).",
      "tag.i.value": 'A NIP-73 id such as "isbn:…", "podcast:guid:…" or a URL.',
      "tag.i.hint": "Optional URL where the item can be seen.",
      "tag.title":
        "A name for a NIP-51 set, NIP-52 calendar event, NIP-53 live event or NIP-99 listing.",
      "tag.title.value": "The title text.",
      "tag.t": "A hashtag.",
      "tag.t.value": "The topic, in lowercase and without the #.",
      "example.full": "Profile with extra fields",
      "example.full.explain":
        "Erin sets name and display_name, a website, a banner and a birthday without a year.",
      "example.bot": "Bot account",
      "example.bot.explain":
        "Dave's automated status account says bot: true so clients can label it.",
      "example.legacy": "Legacy relay map (deprecated)",
      "example.legacy.explain":
        "How old clients stored relays. Still found in the wild; new clients should read and write kind 10002 instead.",
      "example.note": "Note with generic tags",
      "example.note.explain":
        "A kind 1 note that refers to a URL (r), a book (i) and two hashtags (t).",
    },
  },
  n25: {
    title: "Reactions",
    summary:
      'Likes, dislikes and emoji reactions as kind 7 events that point at the note you reacted to. "+" is a like, "-" a dislike, anything else an emoji. Kind 17 does the same for web pages and other things outside Nostr.',
    text: {
      "how.content.title": "The content is the reaction",
      "how.content.body":
        '"+" (or an empty string) means like, "-" means dislike. Any other emoji, or a :shortcode: custom emoji, is shown as-is and is not counted as either.',
      "how.target.title": "Point at the event",
      "how.target.body":
        "An e tag with the id of the event you react to is required. Add a relay hint and the author's pubkey so others can find it. If you add more e tags, the target must be the last one.",
      "how.author.title": "Notify the author",
      "how.author.body":
        "A p tag with the author's pubkey lets them see the reaction. For an addressable event such as an article, also add an a tag, and a k tag with the target's kind.",
      "how.emoji.title": "Custom emoji",
      "how.emoji.body":
        "Put exactly one :shortcode: in the content and one matching NIP-30 emoji tag with the image URL. Clients that support it show the image.",
      "how.external.title": "Reacting to things outside Nostr",
      "how.external.body":
        "To react to a website or a podcast episode, publish kind 17 instead, with NIP-73 k (type) and i (identifier) tags.",
      "related.30": "Custom emoji reactions use NIP-30 emoji tags.",
      "related.73": "Kind 17 external reactions use NIP-73 k and i tags.",
      "related.01": "e, p and a tags and relay hints work as defined in NIP-01.",
      "event.reaction.label": "Reaction (kind 7)",
      "event.reaction.explain": "A reaction to another Nostr event.",
      "content.reaction":
        '"+" or empty = like, "-" = dislike, an emoji or one :shortcode: = emoji reaction.',
      "tag.e":
        "The event being reacted to. Required; if there are several e tags, the target is the last.",
      "tag.e.id": "Id of the event you are reacting to.",
      "tag.e.pubkey": "Author of that event, as a hint for finding it.",
      "tag.relay": "A relay where the target (or its author) can be found.",
      "tag.p":
        "Author of the event being reacted to, so they are notified. The target's author goes last.",
      "tag.p.pubkey": "Pubkey of the target event's author.",
      "tag.a": "For addressable events (articles…): the target's address, next to the e tag.",
      "tag.a.addr": "Address of the reacted-to event as kind:pubkey:d-tag.",
      "tag.k": "Kind of the event being reacted to.",
      "tag.k.kind": 'The kind as a string, e.g. "1" or "30023".',
      "tag.emoji": "The NIP-30 custom emoji used in the content. Only one.",
      "tag.emoji.shortcode": "Name of the emoji: letters, digits, - and _ only, without colons.",
      "tag.emoji.image": "URL of the emoji image.",
      "tag.emoji.set": "Optional address of the kind 30030 emoji set it comes from.",
      "event.external.label": "External reaction (kind 17)",
      "event.external.explain":
        "A reaction to something that is not a Nostr event: a website, a podcast, a book.",
      "tag.ext.k": "NIP-73 type of the thing you react to. Pairs with an i tag.",
      "tag.ext.k.type": 'For example "web", "podcast:guid" or "podcast:item:guid".',
      "tag.ext.i": "NIP-73 identifier of the thing you react to.",
      "tag.ext.i.value": "The identifier: a URL, or a prefixed id like podcast:item:guid:….",
      "tag.ext.i.hint": "Optional web page where the item can be seen.",
      "example.like": "Like a note",
      "example.like.explain":
        "Alice likes Erin's ostrich drawing: e with relay and author hints, p for Erin, k = 1.",
      "example.article": "Like an article",
      "example.article.explain":
        "Erin likes Frank's article. Because it is addressable, an a tag sits next to the e tag.",
      "example.custom-emoji": "Custom emoji reaction",
      "example.custom-emoji.explain":
        "Bob reacts with :ostrich:. The emoji tag tells clients which image to draw.",
      "example.website": "Star a web page",
      "example.podcast": "Like a podcast episode",
      "example.podcast.explain":
        "Two k/i pairs: the show (podcast:guid) and the episode (podcast:item:guid), each with a link.",
    },
  },
  n26: {
    title: "Delegated Event Signing",
    summary:
      "Unrecommended: use NIP-46 remote signing instead. Let one key publish on behalf of another through a signed delegation tag limited by kind and time window.",
    text: {
      "how.unrecommended.title": "Unrecommended: use NIP-46",
      "how.unrecommended.body":
        "Every client and relay has to understand delegation for it to work, which is a lot of work for little gain. To keep your main key safe, use a NIP-46 remote signer (bunker) instead.",
      "how.conditions.title": "Write the conditions",
      "how.conditions.body":
        'The delegator chooses what the other key may do, for example "kind=1&created_at>…&created_at<…": only notes, only inside a time window. Always set both time limits.',
      "how.token.title": "Sign the delegation string",
      "how.token.body":
        'The delegator signs sha256("nostr:delegation:<delegatee pubkey>:<conditions>") with a Schnorr signature. That 64-byte signature is the token.',
      "how.publish.title": "The delegatee publishes",
      "how.publish.body":
        "The delegatee signs a normal event with its own key and adds the delegation tag: delegator pubkey, conditions, token.",
      "how.verify.title": "Readers check and attribute",
      "how.verify.body":
        "A supporting client verifies the token against the delegator's pubkey, checks the event matches the conditions, then shows the event as if the delegator had posted it.",
      "related.46":
        "NIP-46 remote signing is the recommended way to keep your main key off devices.",
      "related.01":
        "The delegated event is still an ordinary NIP-01 event signed by the delegatee.",
      "event.delegated.label": "Delegated event",
      "event.delegated.explain":
        "Any event signed by a delegatee key and carrying a delegation tag that proves the delegator allowed it.",
      content: "The event's normal content; delegation does not change it.",
      "tag.delegation":
        "Proof that the delegator allowed this key to publish this kind of event in this time window.",
      "tag.delegation.delegator":
        "Pubkey of the delegator: the identity the event is published for.",
      "tag.delegation.conditions":
        'Rules joined with &: "kind=N" allows a kind; "created_at<T" and "created_at>T" bound the time.',
      "tag.delegation.token":
        'Delegator\'s Schnorr signature (64 bytes, hex) over sha256("nostr:delegation:<delegatee pubkey>:<conditions>").',
      "example.note": "Bob posts for Alice",
      "example.note.explain":
        "Alice allowed Bob's key to post kind 1 notes for one month from 31 December 2024. Bob signs; supporting clients show it as Alice's note.",
    },
  },
  n27: {
    title: "Text Note References",
    summary:
      "How to mention people and quote events inside a note's text: write nostr: links in the content, and add p or q tags when you want the person notified or the quote counted.",
    text: {
      "how.write.title": "Mentions live in the text",
      "how.write.body":
        'When you type "@mattn" and pick a profile, the client writes nostr:nprofile1… (or nostr:npub1…) into the content at that spot. Events work the same with nostr:nevent1…, nostr:note1… or nostr:naddr1….',
      "how.tags.title": "Tags decide who gets notified",
      "how.tags.body":
        "Adding a p tag for a mentioned person notifies them. Adding a q tag for a quoted event lets that event count the mention. Both are optional.",
      "how.read.title": "Readers turn links into names and previews",
      "how.read.body":
        "A reading client finds nostr: links in the content, decodes them, fetches the profile or event, and shows @name or an embedded preview instead of the raw code.",
      "how.silent.title": "Mention without pinging",
      "how.silent.body":
        "Leave out the p tag and you still get a clickable mention, but the person is not notified. Leave out an e or q tag and your reference won't show up among the replies of that note.",
      "related.21": "Mentions are nostr: URIs as defined in NIP-21.",
      "related.19":
        "The codes inside those URIs are NIP-19 entities (npub, nprofile, nevent, naddr…).",
      "related.18": "q tags for quotes come from NIP-18 reposts.",
      "related.23": "Long-form articles use the same mention format in their Markdown.",
      "event.note.label": "Note with references",
      "event.note.explain":
        "Any text event (kind 1 notes, kind 30023 articles, kind 1111 comments) whose content mentions profiles or events.",
      content:
        "The text, with nostr:npub…, nostr:nprofile…, nostr:note…, nostr:nevent… or nostr:naddr… links where the mentions are.",
      "tag.p": "Notifies a person mentioned in the content.",
      "tag.p.pubkey": "Pubkey of the mentioned person (the one inside the npub or nprofile).",
      "tag.relay": "Optional relay hint.",
      "tag.q": "Marks an event quoted in the content, so it can count the quote.",
      "tag.q.target": "Event id (64 hex) or address (kind:pubkey:d) of the quoted event.",
      "tag.q.pubkey": "Author of the quoted event, for regular events.",
      "example.mention": "Mention two people",
      "example.mention.explain":
        "Alice recommends Erin and Bob. Each nostr:npub in the text has a matching p tag, so both get notified.",
      "example.quote": "Quote a note",
      "example.quote.explain":
        "Carol quotes Bob's note with nostr:note1… and adds a q tag (and a p tag) so Bob sees the quote.",
      "example.silent": "Mention without notifying",
      "example.silent.explain":
        "Grace links Dave's profile with an nprofile (which carries a relay hint) but adds no p tag, so Dave isn't pinged.",
    },
  },
  n28: {
    title: "Public Chat",
    summary:
      "Unrecommended: use NIP-29 relay-based groups instead. Open chat channels built from five kinds: create a channel (40), update its info (41), post messages (42), and hide messages (43) or mute users (44) for yourself.",
    text: {
      "how.unrecommended.title": "Unrecommended: use NIP-29",
      "how.unrecommended.body":
        "Anyone can post into a NIP-28 channel and moderation happens only in each reader's client, so spam is hard to stop. NIP-29 groups let a relay enforce membership and moderation.",
      "how.create.title": "Create a channel",
      "how.create.body":
        "A kind 40 event creates the channel. Its content is JSON with name, about, picture and relays. The event's id becomes the channel id.",
      "how.metadata.title": "Update the channel info",
      "how.metadata.body":
        "kind 41 replaces the channel's metadata. It points at the kind 40 with a root e tag. Clients ignore kind 41 from anyone but the channel creator.",
      "how.message.title": "Post and reply",
      "how.message.body":
        'kind 42 messages carry an e tag to the channel marked "root". A reply adds a second e tag marked "reply" and a p tag for the person answered (NIP-10 markers).',
      "how.moderation.title": "Moderation is up to each client",
      "how.moderation.body":
        "kind 43 hides one message and kind 44 mutes a user, both for the person who published them. Clients may also use them to hide content for others.",
      "related.29": "NIP-29 relay-based groups are the recommended replacement.",
      "related.10": "Messages use NIP-10 marked e tags (root, reply).",
      "related.C7": "NIP-C7 defines the kind 9 chat messages used inside NIP-29 groups.",
      "flow.channel.label": "Life of a channel",
      "flow.channel.explain":
        "From creating a channel to moderating it, in the order a client would publish.",
      "flow.channel.create": "Dave creates the channel; its event id is the channel id.",
      "flow.channel.metadata": "Dave updates the description and adds categories.",
      "flow.channel.message": "Bob posts a question, and Dave replies.",
      "flow.channel.hide": "Grace hides a message she doesn't need to see.",
      "flow.channel.mute": "Grace mutes a user in her own client.",
      "schema.meta": "Channel metadata. Clients may add other fields.",
      "field.name": "Channel name.",
      "field.about": "Channel description.",
      "field.picture": "URL of the channel picture.",
      "field.relays": "Relays where the channel's events should be read and published.",
      "schema.reason": "Optional JSON with a reason.",
      "field.reason": "Why the message was hidden or the user muted.",
      "tag.relay": "Relay where the referenced event can be found.",
      "tag.e-root": 'Points at the channel (the kind 40 event), marked "root".',
      "tag.e-root.id": "Id of the kind 40 channel creation event.",
      "tag.marker": "NIP-10 marker saying what this e tag points at.",
      "marker.root": "The channel this event belongs to.",
      "marker.reply": "The message being replied to.",
      "tag.p": "Person being replied to, so they are notified.",
      "tag.p.pubkey": "Pubkey of the person.",
      "tag.t": "A category for the channel, for search and filtering.",
      "tag.t.value": "Category name.",
      "event.create.label": "Create channel (kind 40)",
      "event.create.explain":
        "Creates a public chat channel. Its id identifies the channel from now on.",
      "content.create": "Stringified JSON with the channel's name, about, picture and relays.",
      "event.metadata.label": "Channel metadata (kind 41)",
      "event.metadata.explain":
        "Updates a channel's metadata without changing the channel id. Only the creator's latest kind 41 counts.",
      "content.metadata": "Stringified JSON with the new name, about, picture and relays.",
      "event.message.label": "Channel message (kind 42)",
      "event.message.explain": "A chat message in a channel, or a reply to another message.",
      "content.message": "The message text.",
      "tag.e-reply": 'Points at the message being answered, marked "reply".',
      "tag.e-reply.id": "Id of the kind 42 message you reply to.",
      "event.hide.label": "Hide message (kind 43)",
      "event.hide.explain": "You no longer want to see a message.",
      "content.hide": 'Optional JSON such as {"reason": "…"}.',
      "tag.e-hide": "The message to hide.",
      "tag.e-hide.id": "Id of the kind 42 message.",
      "event.mute.label": "Mute user (kind 44)",
      "event.mute.explain": "You no longer want to see messages from someone.",
      "content.mute": 'Optional JSON such as {"reason": "…"}.',
      "tag.p-mute": "The user to mute.",
      "tag.p-mute.pubkey": "Pubkey of the muted user.",
      "example.create": "Create a channel",
      "example.update": "Update channel info",
      "example.root": "First message",
      "example.reply": "Reply to a message",
      "example.reply.explain":
        "Two e tags: the channel (root) and Bob's message (reply), plus a p tag so Bob is notified.",
      "example.hide": "Hide a message",
      "example.mute": "Mute a user",
    },
  },
  n29: {
    title: "Relay-based Groups",
    summary:
      "Closed or open groups that a relay enforces: members post with an h tag, admins manage the group with kinds 9000–9020, and the relay publishes the group's metadata, admins and members as kinds 39000–39005.",
    text: {
      "how.relay.title": "The relay owns the group",
      "how.relay.body":
        'A group is an id (like "film-cameras") on a relay that enforces rules for it. The relay signs the group\'s state (metadata, admins, members) with its own key, as a d-tagged kind 39000–39005 event.',
      "how.h.title": "Everything carries an h tag",
      "how.h.body":
        "Messages, threads and moderation events sent to a group have an h tag with the group id. The relay accepts or rejects them according to the group's rules.",
      "how.join.title": "Join and leave",
      "how.join.body":
        "Send kind 9021 to ask to join, with an invite code if you have one; the relay or an admin answers with a kind 9000 that adds you. kind 9022 leaves the group.",
      "how.moderation.title": "Admins moderate with events",
      "how.moderation.body":
        "Admins publish kinds 9000–9010 (add or remove users, edit metadata, delete messages, create invites, pin events). Replaying them in order rebuilds the group's state.",
      "how.previous.title": "Timeline references",
      "how.previous.body":
        "The previous tag lists the first 8 hex characters of recent events seen in the group. Relays reject events that cite unknown ids, so a message can't be replayed out of context on another relay.",
      "how.forks.title": "Move or fork",
      "how.forks.body":
        "If the relay goes away, the group's events can be copied to another relay that keeps the same id and admins (a move) or changes them (a fork). Clients notice through kind 10009 group lists.",
      "related.28": "NIP-29 replaces NIP-28 public chat channels.",
      "related.11":
        'The relay key that signs group state is the "self" pubkey in the relay\'s NIP-11 document.',
      "related.C7": "Group chat messages are NIP-C7 kind 9 events with an h tag.",
      "related.51": "kind 10009 (NIP-51) stores the list of groups a user is in.",
      "related.98": "LiveKit tokens are requested with a NIP-98 HTTP auth event.",
      "related.19":
        "A group is shared as an naddr of its kind 39000 event, optionally with ?invite=<code>.",
      "flow.membership.label": "Joining a group",
      "flow.membership.explain": "From asking to join to chatting and leaving.",
      "flow.membership.join": "Grace asks to join with the invite code Carol gave her.",
      "flow.membership.put": "Carol (admin) adds Grace with a kind 9000.",
      "flow.membership.members": "The relay updates the kind 39002 member list.",
      "flow.membership.chat": "Members chat with kind 9 messages carrying h and previous tags.",
      "flow.membership.leave": "Grace leaves with a kind 9022; the relay removes her.",
      "flow.livekit.label": "Joining a live audio/video room",
      "flow.livekit.explain": "Groups with a livekit tag offer a LiveKit room next to the chat.",
      "flow.livekit.metadata": "The group metadata has a livekit tag.",
      "flow.livekit.auth": "Grace signs a kind 27235 auth event for the token URL.",
      "flow.livekit.token": "Her client fetches a LiveKit token from the relay with that event.",
      "flow.livekit.participants": "The relay lists who is live in kind 39004.",
      "tag.h": "The group this event is sent to.",
      "tag.h.id": "Group id: a random string, unique on its relay.",
      "tag.d": "The group this state event describes (relay-signed events use d, not h).",
      "tag.previous":
        "Short ids of recent events in the group, so the event can't be used out of context.",
      "tag.previous.ref":
        "First 8 hex characters (4 bytes) of an event seen in this group among the last 50, not your own.",
      "tag.name": "Group name.",
      "tag.name.value": "Name shown in clients.",
      "tag.picture": "Group picture.",
      "tag.url.value": "Image URL.",
      "tag.banner": "Wide banner image.",
      "tag.about": "Group description.",
      "tag.about.value": "A short description of the group.",
      "tag.private": "Only members can read the group's messages.",
      "tag.restricted": "Only members can write to the group.",
      "tag.hidden": "The relay hides the group's metadata from non-members.",
      "tag.closed": "Join requests are ignored unless they carry a valid invite code.",
      "tag.livekit": "The group has a LiveKit live audio/video room.",
      "tag.supported_kinds":
        "Event kinds the group accepts. Missing = all kinds; empty = none (AV-only).",
      "tag.supported_kinds.kind": "A kind number as a string.",
      "tag.parent": "This group is a subgroup of another group on the same relay.",
      "tag.parent.value": "Id of the parent group.",
      "tag.child": "A subgroup, in display order.",
      "tag.child.value": "Id of the child group.",
      "tag.p.pubkey": "A user's pubkey.",
      "tag.p.role":
        'A role name such as "admin" or "moderator" (the relay decides what each role may do).',
      "tag.e.id": "Id of an event in the group.",
      "tag.a": "An addressable event, as kind:pubkey:d.",
      "tag.a.addr": "Address of the event.",
      "tag.code": "Invite code that pre-approves the join request.",
      "tag.code.value": "The invite code.",
      "tag.code-invite": "The invite code to create.",
      "tag.p-put": "The user to add (or whose roles to update), followed by optional roles.",
      "tag.p-remove": "The user to remove from the group.",
      "tag.e-delete": "The event to delete from the group.",
      "tag.e-pin": "A pinned event, in display order.",
      "tag.p-admin": "An admin and their roles.",
      "tag.p-member": "A member of the group.",
      "tag.role": "A role this relay supports.",
      "tag.role.name": "Role name.",
      "tag.role.description": "Optional description of what the role can do.",
      "tag.participant": "Someone who is live in the audio/video room right now.",
      "tag.u": "The exact URL being requested (NIP-98).",
      "tag.u.value": "https://<relay>/.well-known/nip29/livekit/<group-id>",
      "tag.method": "The HTTP method of the request (NIP-98).",
      "tag.method.value": "GET for the token endpoint.",
      "content.reason": "Optional reason, shown to admins or in logs.",
      "content.empty": "Empty.",
      "content.chat": "The message text.",
      "content.description": "A human-readable description of the list.",
      "event.chat.label": "Group message (kind 9 or 11)",
      "event.chat.explain":
        "Any normal event posted into a group: NIP-C7 chat messages (9), threads (11) and more, with an h tag.",
      "event.join.label": "Join request (kind 9021)",
      "event.join.explain":
        'Asks the relay to add you. Rejected with "duplicate: " if you\'re already a member.',
      "event.leave.label": "Leave request (kind 9022)",
      "event.leave.explain": "Removes you from the group; the relay answers with a kind 9001.",
      "event.put-user.label": "Add user (kind 9000)",
      "event.put-user.explain": "Admin action: add a user or update their roles.",
      "event.remove-user.label": "Remove user (kind 9001)",
      "event.remove-user.explain": "Admin action: remove a user from the group.",
      "event.edit-metadata.label": "Edit metadata (kind 9002)",
      "event.edit-metadata.explain":
        "Admin action: set the group's name, picture, flags, supported kinds and parent/children.",
      "event.delete-event.label": "Delete event (kind 9005)",
      "event.delete-event.explain": "Admin action: delete a message from the group.",
      "event.create-group.label": "Create group (kind 9007)",
      "event.create-group.explain": "Admin action: create a group with this id on the relay.",
      "event.delete-group.label": "Delete group (kind 9008)",
      "event.delete-group.explain": "Admin action: delete the group. Subgroups become root groups.",
      "event.create-invite.label": "Create invite (kind 9009)",
      "event.create-invite.explain":
        "Admin action: create an invite code for kind 9021 join requests.",
      "event.update-pin-list.label": "Update pins (kind 9010)",
      "event.update-pin-list.explain":
        "Admin action: the complete, ordered list of pinned events. An empty list clears the pins.",
      "event.metadata.label": "Group metadata (kind 39000)",
      "event.metadata.explain":
        "Relay-signed: how clients should display the group, and its access flags.",
      "event.admins.label": "Group admins (kind 39001)",
      "event.admins.explain": "Relay-signed: admins and their roles.",
      "event.members.label": "Group members (kind 39002)",
      "event.members.explain":
        "Relay-signed: members. May be partial or missing; don't rely on it.",
      "event.roles.label": "Group roles (kind 39003)",
      "event.roles.explain": "Relay-signed: the role names this relay understands.",
      "event.participants.label": "Live participants (kind 39004)",
      "event.participants.explain": "Relay-signed: who is in the live audio/video room.",
      "event.pinned.label": "Pinned events (kind 39005)",
      "event.pinned.explain": "Relay-signed copy of the latest accepted pin list.",
      "event.livekit-auth.label": "LiveKit auth (kind 27235)",
      "event.livekit-auth.explain":
        "A NIP-98 HTTP auth event proving who asks for the LiveKit token.",
      "example.chat": "Chat message",
      "example.join": "Join with an invite",
      "example.join.explain":
        "Grace asks to join and includes the invite code, so the relay can accept her right away.",
      "example.leave": "Leave the group",
      "example.put-user": "Add Grace as a member",
      "example.remove-user": "Remove a spammer",
      "example.edit-metadata": "Set name and access",
      "example.delete-event": "Delete a message",
      "example.create-group": "Create the group",
      "example.delete-group": "Delete the group",
      "example.create-invite": "Create an invite code",
      "example.update-pin-list": "Pin a message",
      "example.metadata": "Film Cameras metadata",
      "example.admins": "Admin list",
      "example.members": "Member list",
      "example.roles": "Supported roles",
      "example.participants": "Who is live",
      "example.pinned": "Pinned messages",
      "example.livekit-auth": "Token request auth",
      "example.token": "Fetch a LiveKit token",
      "http.livekit-token.label": "LiveKit token endpoint",
      "http.livekit-token.explain":
        "The relay checks the group's rules and returns a LiveKit JWT and server URL for its audio/video room.",
      "http.livekit-token.authorization": '"Nostr " followed by the base64 kind 27235 auth event.',
      "http.livekit-token.200": "Access granted.",
      "http.livekit-token.200.body":
        "The LiveKit JWT (its sub starts with your hex pubkey) and the LiveKit server URL.",
      "http.livekit-token.401": "Missing or invalid auth event.",
      "http.livekit-token.403": "You are not allowed in this group's room.",
    },
  },
  n30: {
    title: "Custom Emoji",
    summary:
      "Use your own images as emoji: write :shortcode: in the text and add an emoji tag that maps the shortcode to an image URL. Works in profiles, notes, comments, reactions and statuses.",
    text: {
      "how.tag.title": "Map a shortcode to an image",
      "how.tag.body":
        'Each emoji tag is ["emoji", shortcode, image URL]. The shortcode may only use letters, digits, - and _.',
      "how.shortcode.title": "Write :shortcode: in the text",
      "how.shortcode.body":
        "Put :ostrich: where the emoji should appear. Clients that support NIP-30 replace it with the image from the matching tag; others show the text.",
      "how.set.title": "Say which set it came from",
      "how.set.body":
        "A fourth value can point at the kind 30030 emoji set (NIP-51) the emoji belongs to, so readers can find and add the whole set.",
      "how.where.title": "Where emoji are rendered",
      "how.where.body":
        "In kind 0 profiles the name and about fields are emojified; in notes (1), comments (1111), reactions (7) and user statuses (30315) the content is.",
      "related.51": "Emoji sets are kind 30030 lists from NIP-51.",
      "related.25": "A NIP-25 reaction can be a single custom emoji.",
      "related.38": "User statuses (NIP-38) can include custom emoji.",
      "related.22": "NIP-22 comments can include custom emoji.",
      "event.note.label": "Note with custom emoji",
      "event.note.explain": "A note, comment or status whose content uses :shortcode: emoji.",
      "content.note": "Text with :shortcode: placeholders, one per emoji tag.",
      "tag.emoji": "Defines one custom emoji used in this event.",
      "tag.emoji-one": "The one custom emoji used as the reaction.",
      "tag.emoji.shortcode": "Name used between colons in the text. Letters, digits, - and _ only.",
      "tag.emoji.image": "URL of the emoji image.",
      "tag.emoji.set": "Optional address (30030:pubkey:d) of the emoji set the emoji belongs to.",
      "event.reaction.label": "Custom emoji reaction (kind 7)",
      "event.reaction.explain":
        "A reaction whose content is a single :shortcode: with its emoji tag.",
      "content.reaction": "Exactly one :shortcode:.",
      "tag.e": "The event being reacted to.",
      "tag.e.id": "Id of the event.",
      "tag.e.pubkey": "Author of the event, as a hint.",
      "tag.relay": "Optional relay hint.",
      "tag.p": "The author being reacted to.",
      "tag.p.pubkey": "Pubkey of the author.",
      "event.profile.label": "Profile with custom emoji (kind 0)",
      "event.profile.explain":
        "Profile metadata whose name and about may contain :shortcode: emoji.",
      "content.profile": "Stringified profile JSON.",
      "schema.profile": "Profile fields; only name and about are emojified.",
      "field.name": "Name, may contain :shortcode:.",
      "field.about": "Bio, may contain :shortcode:.",
      "example.note": "Note with two emoji",
      "example.note.explain":
        "Erin uses :ostrich: from her emoji set and a one-off :bolt:. Each shortcode in the text has its tag.",
      "example.reaction": "React with a custom emoji",
      "example.profile": "Emoji in a bio",
    },
  },
  n31: {
    title: "Dealing with Unknown Events",
    summary:
      "Unrecommended, though alt tags are still common. Give custom-kind events an alt tag with a one-line human description, so clients that don't know the kind can still show something sensible.",
    text: {
      "how.unrecommended.title": "Unrecommended, but you will see it",
      "how.unrecommended.body":
        "The NIP is marked unrecommended as unnecessarily bloated, and has no direct replacement. Many apps still add alt tags, so it helps to recognise them. NIP-89 app handlers are the richer way to deal with unknown kinds.",
      "how.problem.title": "The problem",
      "how.problem.body":
        "A note can quote a calendar event or a badge. A client that only knows kind 1 has no idea how to display it.",
      "how.alt.title": "Add an alt tag",
      "how.alt.body":
        'The publisher adds ["alt", "<short plain-text summary>"] that makes sense to someone who knows nothing about the kind.',
      "how.fallback.title": "Show the fallback",
      "how.fallback.body":
        "The simple client shows the alt text, perhaps with a link to an app that can open the event, instead of a blank or confusing box.",
      "related.89": "NIP-89 lets clients find an app that handles an unknown kind.",
      "related.52": "Calendar events (NIP-52) are a typical custom kind that benefits from alt.",
      "event.custom.label": "Custom-kind event with alt",
      "event.custom.explain":
        "Any event of a kind that isn't meant to be read as text, carrying an alt summary.",
      content: "The event's own content, defined by its kind's NIP.",
      "tag.alt": "A short human-readable summary for clients that don't understand this kind.",
      "tag.alt.value": "Plain text, one line, with enough context for someone new to the kind.",
      "example.calendar": "Calendar event",
      "example.calendar.explain":
        "A kind 31923 meetup. A kind 1 client can't render it, but can print the alt line.",
      "example.badge": "Badge definition",
    },
  },
  n32: {
    title: "Labeling",
    summary:
      "Attach labels to events, people, relays, URLs or topics with kind 1985: an L tag names the vocabulary, l tags carry the labels. Authors can also label their own events. Used for moderation, licences, languages and classification.",
    text: {
      "how.namespace.title": "Pick a namespace",
      "how.namespace.body":
        'The L tag names the vocabulary: an ISO standard ("ISO-639-1"), reverse-domain notation ("com.example.ontology"), "ugc" for free user input, or "#t" to attach a hashtag.',
      "how.label.title": "Add labels",
      "how.label.body":
        'Each l tag is a label plus the namespace it belongs to. The mark must match an L tag in the event. With no mark at all, "ugc" is assumed.',
      "how.target.title": "Say what you are labeling",
      "how.target.body":
        "A kind 1985 event must name at least one target: e (event), p (person), a (addressable event), r (relay or URL) or t (topic). Add relay hints to e and p.",
      "how.self.title": "Label your own events",
      "how.self.body":
        "Any event can carry L and l tags about itself, for example the language of a note or the place it talks about.",
      "how.query.title": "Query by namespace",
      "how.query.body":
        'Because L and l are single-letter tags, relays index them: a filter like {"#L": ["license"]} finds every licence label. Keep each label event to one namespace.',
      "related.36": "NIP-36 content warnings can be qualified with L/l labels.",
      "related.56": "NIP-56 reports are another, more specific way to flag content.",
      "related.09": "Bulk labels are corrected by deleting (NIP-09) and republishing.",
      "event.label.label": "Label event (kind 1985)",
      "event.label.explain": "Attaches labels from one namespace to one or more targets.",
      "content.label": "Optional longer explanation of why the targets were labelled this way.",
      "tag.L": "A label namespace used in this event.",
      "tag.L.value": 'Namespace: an ISO standard, reverse-domain name, "ugc" or "#<tag>".',
      "tag.l": "A label.",
      "tag.l.value": "The label itself: short and meaningful, a category rather than a value.",
      "tag.l.mark": "The namespace this label belongs to; must match an L tag.",
      "tag.e": "Target: an event.",
      "tag.e.id": "Id of the labelled event.",
      "tag.p": "Target: a person.",
      "tag.p.pubkey": "Pubkey of the labelled person.",
      "tag.a": "Target: an addressable event.",
      "tag.a.addr": "Address as kind:pubkey:d.",
      "tag.r": "Target: a relay or web URL.",
      "tag.r.url": "The relay URL (wss://) or web URL.",
      "tag.t": "Target: a topic.",
      "tag.t.value": "The topic (hashtag) being labelled.",
      "tag.relay": "Relay hint for the target.",
      "event.self-label.label": "Self-labelled event",
      "event.self-label.explain": "Any event labelling itself with L and l tags.",
      "content.self": "The event's own content.",
      "example.topic": "Associate people with a topic",
      "example.topic.explain":
        'Carol suggests Erin and herself for #photography. The "#t" namespace means "treat this label as a t tag".',
      "example.license": "License an article",
      "example.license.explain":
        "Frank labels his article CC-BY-4.0 and explains it in the content.",
      "example.relay": "Label a relay",
      "example.language": "Note language",
      "example.place": "Note location",
    },
  },
  n33: {
    title: "Parameterized Replaceable Events",
    summary:
      'Deprecated: renamed "addressable events" and moved into NIP-01. Kinds 30000–39999 are replaced per author and d tag, so the newest version wins and one address always finds it.',
    text: {
      "how.moved.title": "Now called addressable events, in NIP-01",
      "how.moved.body":
        "This NIP was renamed and merged into NIP-01. The rules below are unchanged; read NIP-01 for the current text.",
      "how.range.title": "Kinds 30000 to 39999",
      "how.range.body":
        "Events in this kind range are addressable. Articles (30023), user statuses (30315) and lists (30000+) all use it.",
      "how.d.title": "The d tag names the slot",
      "how.d.body":
        "Each event has a d tag. Together, kind + pubkey + d form the event's address: one author can have many articles, one per d value.",
      "how.replace.title": "Newest wins",
      "how.replace.body":
        "When a relay receives a newer event (by created_at) with the same address, it keeps the new one and drops the older. That is how editing works.",
      "how.address.title": "Link by address, not id",
      "how.address.body":
        'The id changes with every edit, so link to the address instead: an a tag "kind:pubkey:d" or a NIP-19 naddr.',
      "related.01": "Addressable events are now defined in NIP-01.",
      "related.19": "naddr encodes an address (kind, pubkey, d, relays).",
      "related.23": "Long-form articles are the best-known addressable events.",
      "event.addressable.label": "Addressable event",
      "event.addressable.explain": "Any event with a kind from 30000 to 39999 and a d tag.",
      content: "The content, defined by the kind's own NIP.",
      "tag.d": "The identifier that, with kind and pubkey, makes the event's address. Required.",
      "tag.d.value": "Any string, even empty. Keep it stable across edits.",
      "example.v2": "Edited article",
      "example.v2.explain":
        "Frank's article after an edit: same kind, pubkey and d, newer created_at. Relays keep only this version.",
      "example.status": "User status",
      "actor.author": "Frank's client",
      "actor.relay": "Relay",
      "actor.reader": "Reader's client",
      "step.v1.label": "EVENT (first version)",
      "step.v1.explain": "Frank publishes his article with d = protocols-not-platforms.",
      "step.store.label": "Store under its address",
      "step.store.explain": "The relay files it under 30023:<frank>:protocols-not-platforms.",
      "step.v2.label": "EVENT (edited version)",
      "step.v2.explain":
        "Frank fixes a typo and publishes again with the same d and a newer created_at.",
      "step.replace.label": "Replace the old version",
      "step.replace.explain": "Same address, newer timestamp: the relay deletes the first version.",
      "step.req.label": "REQ by address",
      "step.req.explain": "A reader asks for kind 30023 by Frank with that d value.",
      "step.latest.label": "EVENT (latest only)",
      "step.latest.explain": "The relay answers with the edited version only.",
    },
  },
  n34: {
    title: "git stuff",
    summary:
      "Code collaboration over Nostr: announce git repositories, publish their branch state, and send patches, pull requests, issues and status updates as events, with no central forge.",
    text: {
      "how.announce.title": "Announce a repository",
      "how.announce.body":
        "A maintainer publishes kind 30617 with a d identifier, clone and web URLs, and the relays that collect patches and issues. Publishing it makes you a maintainer of the project.",
      "how.euc.title": "Group forks by their first commit",
      "how.euc.body":
        'The r tag marked "euc" holds the earliest unique commit, usually the root commit. Repositories with the same euc are the same project hosted in different places.',
      "how.patch.title": "Send patches",
      "how.patch.body":
        "A kind 1617 event carries the output of git format-patch, an a tag to the repository and a p tag to the maintainer. Later patches in a series reply to the previous one (NIP-10).",
      "how.pr.title": "Or open a pull request",
      "how.pr.body":
        "Patches over 60 kB should be pull requests (kind 1618): a description, the tip commit in c, and a clone URL where it can be fetched. kind 1619 moves the tip.",
      "how.issues.title": "Issues and replies",
      "how.issues.body":
        "Issues are kind 1621 Markdown events with an optional subject and labels. Replies to issues, patches and pull requests are NIP-22 comments.",
      "how.status.title": "Status by kind",
      "how.status.body":
        "kind 1630 means open, 1631 applied/merged/resolved, 1632 closed and 1633 draft. The latest status from the author or a maintainer wins.",
      "related.22": "Replies to issues, patches and pull requests are NIP-22 comments.",
      "related.10": "Patch series and status events use NIP-10 e markers.",
      "related.19": "nostr:// clone URLs can embed an naddr of the announcement.",
      "related.65": "The kind 10317 grasp list mirrors the NIP-65 relay list idea.",
      "flow.contribute.label": "Contributing a patch",
      "flow.contribute.explain": "From a repository announcement to a merged patch.",
      "flow.contribute.repo": "Dave announces delta-relay and lists his patch relays.",
      "flow.contribute.patch": "Bob sends a patch to those relays, tagging the repo and Dave.",
      "flow.contribute.status": "Dave applies it and publishes a kind 1631 status.",
      "flow.contribute.state": "Dave's repository state now points main at the new commit.",
      "event.repo.label": "Repository announcement (kind 30617)",
      "event.repo.explain":
        "Says a repository exists, where to clone it and where to send patches.",
      "tag.d": "Repository identifier, usually a short kebab-case name.",
      "tag.d.value": "The id; also used in nostr:// clone URLs.",
      "tag.name": "Human-readable project name.",
      "tag.name.value": "Name shown in clients.",
      "tag.description": "Brief project description.",
      "tag.description.value": "One or two sentences.",
      "tag.web": "Web pages for browsing the code.",
      "tag.web.value": "A browsing URL. More may follow.",
      "tag.clone": "URLs for git clone.",
      "tag.clone.value": "A clone URL. More may follow.",
      "tag.relays": "Relays this repository watches for patches and issues.",
      "tag.relays.value": "A relay URL. More may follow.",
      "tag.r-euc":
        "The earliest unique commit, to recognise the same project across hosts and forks.",
      "tag.r-euc.commit": "Commit id (40 hex characters).",
      "tag.r-euc.marker": 'Always "euc".',
      "tag.maintainers": "Other recognised maintainers.",
      "tag.maintainers.value": "A maintainer's pubkey. More may follow.",
      "tag.u": "Marks this repository as a subordinate fork of another.",
      "tag.u.value": "The upstream as 30617:pubkey:id, or its git URL.",
      "tag.u.pubkey": "Upstream author's pubkey.",
      "tag.t": "A label or hashtag.",
      "tag.t.value": "The label text.",
      "tag.relay": "Optional relay hint.",
      "event.state.label": "Repository state (kind 30618)",
      "event.state.explain":
        'Optional source of truth for branches and tags. Each ref is its own tag, named after the ref: ["refs/heads/main", "<commit>"].',
      "tag.HEAD": "The default branch.",
      "tag.HEAD.value": '"ref: refs/heads/<branch>".',
      "event.patch.label": "Patch (kind 1617)",
      "event.patch.explain": "A git patch sent to a repository. Use it for changes under 60 kB.",
      "content.patch": "The output of git format-patch.",
      "tag.a": "The repository this is for.",
      "tag.a.addr": "Repository address 30617:<owner pubkey>:<repo id>.",
      "tag.r":
        "A commit id clients can subscribe to: the repo's euc, or the commit this patch creates.",
      "tag.r.commit": "Commit id (40 hex characters).",
      "tag.p": "Someone to notify: the repository owner or another user.",
      "tag.p.pubkey": "Their pubkey.",
      "tag.t-patch": "Marks the first patch of a series or of a revision.",
      "tag.t-patch.value": '"root" or "root-revision".',
      "marker.root": "First patch of a series.",
      "marker.root-revision": "First patch of a revised series.",
      "tag.e-previous": "The previous patch in the series (NIP-10 reply).",
      "tag.e-previous.id": "Id of the previous patch.",
      "tag.marker": "NIP-10 marker.",
      "tag.commit": "Commit id the patch produces, so the merged commit keeps the same id.",
      "tag.commit.value": "Commit id (40 hex characters).",
      "tag.parent-commit": "Parent of that commit.",
      "tag.parent-commit.value": "Commit id (40 hex characters).",
      "tag.commit-pgp-sig": "PGP signature of the commit; empty for unsigned commits.",
      "tag.commit-pgp-sig.value": "-----BEGIN PGP SIGNATURE-----…",
      "tag.committer": "Committer details needed to recreate the exact commit.",
      "tag.committer.name": "Committer name.",
      "tag.committer.email": "Committer email.",
      "tag.committer.timestamp": "Commit time, unix seconds.",
      "tag.committer.tz": "Timezone offset in minutes.",
      "event.pr.label": "Pull request (kind 1618)",
      "event.pr.explain":
        "Points at proposed changes in a git repository. Use it for larger changes.",
      "content.markdown": "Markdown text.",
      "tag.subject": "Title of the pull request or issue.",
      "tag.subject.value": "Short title.",
      "tag.c": "Tip commit of the proposed branch.",
      "tag.c.value": "Commit id (40 hex characters).",
      "tag.branch-name": "Suggested branch name for the maintainer.",
      "tag.branch-name.value": "Branch name.",
      "tag.e-revises": "A patch this PR revises; that patch should be closed.",
      "tag.e-revises.id": "Id of the root patch.",
      "tag.merge-base": "Most recent common ancestor with the target branch.",
      "tag.merge-base.value": "Commit id (40 hex characters).",
      "event.pr-update.label": "Pull request update (kind 1619)",
      "event.pr-update.explain": "Moves the tip of an existing pull request.",
      "tag.E": "The pull request being updated (NIP-22 root).",
      "tag.E.value": "Id of the kind 1618 event.",
      "tag.P": "Author of the pull request.",
      "tag.P.value": "Their pubkey.",
      "event.issue.label": "Issue (kind 1621)",
      "event.issue.explain": "A bug report, feature request or question about a repository.",
      "event.status.label": "Status (kinds 1630–1633)",
      "event.status.explain":
        "Sets the status of a patch, pull request or issue: 1630 open, 1631 applied/merged/resolved, 1632 closed, 1633 draft.",
      "tag.e-root": 'The issue, PR or root patch whose status this is, marked "root".',
      "tag.e-root.id": "Id of that event.",
      "tag.e-reply": 'The accepted revision, marked "reply", when a revision was applied.',
      "tag.e-reply.id": "Id of the revision's root patch.",
      "tag.q": "A patch that was applied or merged (for kind 1631).",
      "tag.q.id": "Id of the patch event.",
      "tag.q.pubkey": "Author of the patch.",
      "tag.merge-commit": "The merge commit, when merged.",
      "tag.merge-commit.value": "Commit id (40 hex characters).",
      "tag.applied-as-commits": "Commits in the main branch the patches became, when applied.",
      "tag.applied-as-commits.value": "Commit id. More may follow.",
      "event.grasp.label": "Grasp server list (kind 10317)",
      "event.grasp.explain":
        "Grasp servers you prefer for NIP-34 activity, in order of preference.",
      "tag.g": "A grasp server.",
      "tag.g.value": "Its websocket URL.",
      "example.repo": "Announce delta-relay",
      "example.repo.explain":
        "Dave announces the repository behind his relay, with Alice as co-maintainer.",
      "example.state": "Branches and tags",
      "example.state.explain":
        "main and a release tag point at commits; HEAD says main is the default branch.",
      "example.patch": "Bob's patch",
      "example.patch.explain":
        "A one-line fix sent as format-patch output, with the commit details needed to reproduce the exact commit.",
      "example.pr": "Alice's pull request",
      "example.pr-update": "Push new commits to the PR",
      "example.issue": "Grace reports a bug",
      "example.applied": "Mark the patch applied",
      "example.applied.explain":
        "kind 1631 on Bob's patch, quoting it and listing the commit it became in main.",
      "example.closed": "Alternative: close the patch instead",
      "example.grasp": "Bob's grasp servers",
    },
  },
  n35: {
    title: "Torrents",
    summary:
      "A searchable torrent index on Nostr: kind 2003 lists a torrent's info hash, files, trackers and catalogue ids (IMDb, TMDB…) so anyone can build the magnet link. No torrent files are stored on Nostr.",
    text: {
      "how.index.title": "The info hash is the torrent",
      "how.index.body":
        "The x tag holds the v1 BitTorrent info hash. That is all a client needs to build magnet:?xt=urn:btih:<hash> and start downloading from peers.",
      "how.files.title": "List the files",
      "how.files.body":
        "file tags give each path inside the torrent and its size in bytes, so people can see what they will get before downloading.",
      "how.prefixes.title": "Tag with catalogue ids",
      "how.prefixes.body":
        "i tags use prefixes: tcat: for a category path, newznab: for a category id, and imdb:, tmdb:, ttvdb:, mal:, anilist: for database ids. Add a media type where the database has several (tmdb:movie:…).",
      "how.magnet.title": "Trackers and categories",
      "how.magnet.body":
        "Optional tracker tags are added to the magnet link. t tags such as movie, tv, hd or uhd make torrents browsable by category.",
      "how.comments.title": "Comments",
      "how.comments.body":
        "kind 2004 comments work like kind 1 notes and thread with NIP-10 e tags pointing at the torrent.",
      "related.10": "Torrent comments thread with NIP-10 e tags.",
      "related.73": "The i tag follows the NIP-73 external id idea with torrent-specific prefixes.",
      "related.94": "NIP-94 file metadata is the non-torrent way to describe a file.",
      "event.torrent.label": "Torrent (kind 2003)",
      "event.torrent.explain":
        "Enough information to search for content and build its magnet link.",
      "content.torrent": "A long, pre-formatted description of the torrent.",
      "tag.title": "Torrent title.",
      "tag.title.value": "Title shown in search results.",
      "tag.x": "V1 BitTorrent info hash. Required.",
      "tag.x.value": "40 hex characters (20 bytes), as in magnet:?xt=urn:btih:<hash>.",
      "tag.file": "A file inside the torrent.",
      "tag.file.path": "Full path inside the torrent, e.g. info/example.txt.",
      "tag.file.size": "Size in bytes.",
      "tag.tracker": "A tracker to use for this torrent.",
      "tag.tracker.value": "Tracker URL (udp://, http(s)://, ws(s)://).",
      "tag.i": "A reference to a catalogue or category.",
      "tag.i.value": "prefix:value, e.g. imdb:tt1254207, tmdb:movie:10378, tcat:video,movie,hd.",
      "tag.t": "A general category for browsing.",
      "tag.t.value": "e.g. movie, tv, hd, uhd.",
      "event.comment.label": "Torrent comment (kind 2004)",
      "event.comment.explain": "A reply to a torrent; works exactly like a kind 1 note.",
      "content.comment": "The comment text.",
      "tag.e": "The torrent (root) or comment being replied to.",
      "tag.e.id": "Id of the event.",
      "tag.e.marker": "NIP-10 marker.",
      "marker.root": "The torrent itself.",
      "marker.reply": "The comment you answer.",
      "tag.e.pubkey": "Author of that event.",
      "tag.relay": "Optional relay hint.",
      "tag.p": "Someone to notify, like the torrent's publisher.",
      "tag.p.pubkey": "Their pubkey.",
      "example.film": "An open movie",
      "example.film.explain":
        "Big Buck Bunny, indexed with its info hash, two files, a tracker and four catalogue ids.",
      "example.comment": "Comment on the torrent",
    },
  },
  n36: {
    title: "Sensitive Content",
    summary:
      'Add a content-warning tag, with an optional reason, and clients hide the event behind a "show anyway" button until the reader chooses to see it.',
    text: {
      "how.tag.title": "Add a content-warning tag",
      "how.tag.body":
        'The author adds ["content-warning"] or ["content-warning", "<reason>"] to any event whose content readers might not want to see by surprise.',
      "how.hide.title": "Clients hide it until asked",
      "how.hide.body":
        "A supporting client shows the reason (if any) and a button instead of the content. The content is still there in plain text: this is a courtesy, not encryption.",
      "how.labels.title": "Optional labels",
      "how.labels.body":
        'NIP-32 L and l tags, for example in the "content-warning" namespace, let relays and clients filter by kind of warning.',
      "related.32": "L and l labels can qualify the warning for filtering.",
      "related.56": "NIP-56 reports are for flagging other people's content.",
      "event.note.label": "Event with a content warning",
      "event.note.explain":
        "Any event (usually a kind 1 note) whose content should be hidden until the reader agrees.",
      content: "The sensitive content itself, in clear text.",
      "tag.content-warning":
        "Asks clients to hide the content until the reader chooses to show it.",
      "tag.content-warning.reason": "Optional short reason shown in place of the content.",
      "tag.L": "A NIP-32 label namespace.",
      "tag.L.value": 'Namespace, e.g. "content-warning".',
      "tag.l": "A NIP-32 label qualifying the warning.",
      "tag.l.value": 'Label, e.g. "medical" or "spoiler".',
      "tag.l.mark": "The namespace this label belongs to.",
      "example.spoiler": "Spoiler warning",
      "example.spoiler.explain": "Bob hides a TV spoiler behind a reason readers can see first.",
      "example.labelled": "Warning with labels",
      "example.labelled.explain":
        "Carol adds a NIP-32 label so clients can filter medical content.",
      "example.bare": "Warning without a reason",
    },
  },
  n37: {
    title: "Draft Events",
    summary:
      "Save unfinished posts of any kind on relays without anyone else reading them: the draft is encrypted to yourself with NIP-44 inside a kind 31234 wrap, with optional checkpoints and a private relay list.",
    text: {
      "how.wrap.title": "Encrypt the draft to yourself",
      "how.wrap.body":
        "The unsigned draft event is turned into JSON, encrypted with NIP-44 from your key to your own key, and put in the content of a kind 31234. Only you can read it.",
      "how.k.title": "Say what kind it is",
      "how.k.body":
        "The required k tag tells your clients the draft's kind (1 for a note, 30023 for an article) without decrypting it. The d tag makes the wrap replaceable, so saving again overwrites it.",
      "how.expire.title": "Let it expire",
      "how.expire.body":
        "A NIP-40 expiration tag (for example 90 days ahead) is recommended, so forgotten drafts disappear. Publishing a blank content marks the draft as deleted.",
      "how.checkpoint.title": "Keep a history",
      "how.checkpoint.body":
        "kind 1234 checkpoints are encrypted snapshots that point at their draft with an a tag, giving you a revision history.",
      "how.relays.title": "Store drafts on private relays",
      "how.relays.body":
        "kind 10013 lists the relays for private content. The list itself is encrypted to you, and the event is published to your NIP-65 write relays. Prefer relays that require NIP-42 login.",
      "related.44": "Drafts and the relay list are NIP-44 encrypted to the author's own key.",
      "related.40": "NIP-40 expiration tags let drafts expire.",
      "related.42": "Private storage relays should require NIP-42 authentication.",
      "related.65": "kind 10013 is published to the author's NIP-65 write relays.",
      "related.23": "Replaces the deprecated kind 30024 long-form drafts.",
      "flow.drafting.label": "Saving a draft",
      "flow.drafting.explain": "Where drafts go and how revisions are kept.",
      "flow.drafting.relays": "Alice's private relay list says drafts go to relay.delta.example.",
      "flow.drafting.draft": "Her client saves the half-written note as an encrypted draft wrap.",
      "flow.drafting.checkpoint": "A checkpoint saves a revision of the same draft.",
      "event.draft.label": "Draft wrap (kind 31234)",
      "event.draft.explain": "Encrypted storage for one unsigned draft of any kind.",
      "content.draft":
        "NIP-44 ciphertext of the JSON draft, encrypted to the author's own pubkey. Empty = deleted.",
      "content.draft.plain": "After decrypting: the unsigned draft event as JSON.",
      "schema.draft": "An event template (kind, created_at, tags, content); not signed.",
      "tag.d": "Identifier of this draft, so later saves replace it.",
      "tag.d.value": "Any stable identifier.",
      "tag.k": "Kind of the draft inside. Required.",
      "tag.k.value": 'Kind number as a string, e.g. "1".',
      "tag.expiration": "When relays may delete the draft (NIP-40). Recommended.",
      "tag.expiration.value": "Unix timestamp, e.g. now + 90 days.",
      "event.checkpoint.label": "Checkpoint (kind 1234)",
      "event.checkpoint.explain": "An encrypted snapshot (revision) of a draft.",
      "content.checkpoint": "NIP-44 ciphertext of the draft at this point in time.",
      "tag.a": "The draft wrap this checkpoint belongs to.",
      "tag.a.value": "Address 31234:<pubkey>:<d>.",
      "event.relays.label": "Private relay list (kind 10013)",
      "event.relays.explain": "The relays where you keep private events such as drafts.",
      "content.relays": "NIP-44 ciphertext of the relay tags, encrypted to yourself.",
      "content.relays.plain": "After decrypting: a JSON array of relay tags.",
      "schema.relays": "Private tags.",
      "schema.relays.tag": "One relay entry.",
      "schema.relays.name": 'Always "relay".',
      "schema.relays.url": "Relay URL.",
      "example.draft": "Half-written note",
      "example.draft.explain":
        "Alice's unfinished kind 1 note, encrypted to herself, expiring in 90 days.",
      "example.checkpoint": "Saved revision",
      "example.relays": "Drafts relay",
      "example.relays.explain": 'Decrypts to [["relay", "wss://relay.delta.example"]].',
    },
  },
  n38: {
    title: "User Statuses",
    summary:
      "Share a live status next to your name, like what you're doing or the song you're playing, as a kind 30315 event that can expire on its own.",
    text: {
      "how.type.title": "One status per type",
      "how.type.body":
        'kind 30315 is addressable and the d tag is the status type, so you have one current "general" status and one "music" status. Publishing again replaces it.',
      "how.content.title": "The status text",
      "how.content.body":
        'The content is the status itself: "Hiking", "In a meeting", a song title. Emoji and NIP-30 custom emoji are fine.',
      "how.link.title": "Link it",
      "how.link.body":
        "Optionally add one r (URL), p (profile), e (note) or a (addressable event) tag so readers can tap through to what you are doing.",
      "how.expire.title": "Let it expire",
      "how.expire.body":
        "Add a NIP-40 expiration tag so the status disappears by itself. For music, set it to when the track ends.",
      "how.clear.title": "Clear it",
      "how.clear.body": "Publishing the same type with an empty content clears that status.",
      "related.40": "Statuses can expire with NIP-40 expiration tags.",
      "related.30": "The status text may contain NIP-30 custom emoji.",
      "related.01": "kind 30315 is an addressable event as defined in NIP-01.",
      "event.status.label": "User status (kind 30315)",
      "event.status.explain": "A live status shown next to your name, one per status type.",
      content: "The status text. Empty clears the status.",
      "tag.d": "The status type. Required.",
      "tag.d.value": '"general", "music" or another type.',
      "type.general": "What you're doing: working, hiking, out of office.",
      "type.music": "What you're listening to right now.",
      "tag.r": "A URL related to the status.",
      "tag.r.value": "Web URL or app URI (spotify:…).",
      "tag.p": "A profile related to the status.",
      "tag.p.value": "Pubkey.",
      "tag.e": "A note related to the status.",
      "tag.e.value": "Event id.",
      "tag.a": "An addressable event related to the status (a live event, an article).",
      "tag.a.value": "Address as kind:pubkey:d.",
      "tag.relay": "Optional relay hint.",
      "tag.expiration": "When the status should disappear (NIP-40).",
      "tag.expiration.value": "Unix timestamp.",
      "example.general": "What Alice is doing",
      "example.music": "Now playing",
      "example.music.explain": "Bob's music status expires when the 3 min 51 s track ends.",
      "example.clear": "Clear the status",
      "example.clear.explain":
        "Same d, empty content: clients stop showing Alice's general status.",
    },
  },
  n39: {
    title: "Linking Profiles to Other Platforms",
    summary:
      "Prove you also own accounts elsewhere (GitHub, Mastodon, Bluesky, Telegram, Discord…): list them in a kind 10011 event, each pointing at a public post where that account names your npub.",
    text: {
      "how.claim.title": "List your accounts",
      "how.claim.body":
        'Publish kind 10011 with one i tag per account: "platform:identity", for example "github:alice-nostr". Platform names use only a-z, 0-9 and ._-/ and never a colon.',
      "how.proof-text.title": "Post the proof on the other platform",
      "how.proof-text.body":
        'From that account, publish "Verifying that I control the following Nostr public key: <your npub>" as a gist, post or message.',
      "how.proof.title": "Point at the proof",
      "how.proof.body":
        "The second value of the i tag says where the proof is: a Gist id, a post id, or <channel>/<message> for Telegram. Each platform defines how to turn it into a URL.",
      "how.verify.title": "Others verify",
      "how.verify.body":
        "A client builds the proof URL, fetches it and checks that the post is by that account and contains your npub. Accept older wordings too, as long as the npub is there.",
      "related.05":
        "NIP-05 links your key to a domain name; NIP-39 links it to accounts on other platforms.",
      "related.19": "Proofs quote your NIP-19 npub.",
      "related.73":
        "NIP-73 also uses platform-prefixed ids in i tags, for content rather than identities.",
      "event.identities.label": "External identities (kind 10011)",
      "event.identities.explain": "Your claimed accounts on other platforms, each with a proof.",
      "tag.i": "One claimed identity with its proof.",
      "tag.i.claim":
        "platform:identity, e.g. github:<user>, twitter:<user>, mastodon:<instance>/@<user>, telegram:<user id>, bluesky:<handle>, discord:<user>.",
      "tag.i.proof":
        "Where the proof is: a Gist id (github), a post id (twitter, mastodon, bluesky record key), <ref>/<id> (telegram) or <guild>/<channel>/<message> (discord).",
      "tag.i.extra": "Extra values for future extensions; clients should accept them.",
      "example.alice": "Alice's accounts",
      "example.alice.explain":
        "GitHub (proof at gist.github.com/alice-nostr/<id>), Bluesky (bsky.app/profile/alice.bsky.social/post/<id>) and Mastodon.",
      "example.frank": "Telegram and Discord",
    },
  },
} satisfies NipStringsRange;
