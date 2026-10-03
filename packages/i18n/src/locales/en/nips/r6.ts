// Owner: spec author r6 (NIPs letter ids). Adding a key? Also add it to ../../es/nips/r6.ts
// (English text + `// TODO(es)`). `text` holds every TextKey the NIP's spec references.
import type { NipStringsRange } from "../../../nips.ts";

/** NIP-22 comment tags (shared by the NIPs whose replies are kind 1111-style comments). */
const commentRoot = {
  "tag.root.e": "E: the root event of the conversation (upper case = root).",
  "tag.root.e.id": "Id of the root event.",
  "tag.root.e.pubkey": "Author of the root event, so clients can find it on that author's relays.",
  "tag.root.k": "K: the kind of the root event.",
  "tag.root.k.kind": "Kind number of the root, as a string.",
  "tag.root.p": "P: the author of the root event.",
  "tag.root.p.pubkey": "Pubkey of the root's author.",
};
const commentParent = {
  "tag.parent.e": "e: the event you are directly replying to (lower case = parent).",
  "tag.parent.e.id": "Id of the parent event. For a top-level reply it is the root again.",
  "tag.parent.e.pubkey": "Author of the parent event.",
  "tag.parent.k": "k: the kind of the parent event.",
  "tag.parent.k.kind": "Kind number of the parent, as a string.",
  "tag.parent.p": "p: the author of the parent, so they get notified.",
  "tag.parent.p.pubkey": "Pubkey of the parent's author.",
};
const relayHint = {
  "tag.relay": "Optional relay hint: a relay where the referenced event can be found.",
};
const imeta = {
  "tag.imeta":
    "NIP-92 media metadata for a URL in the content: one tag per URL, each value a 'key value' pair.",
  "tag.imeta.url": "First entry: 'url ' followed by the exact URL that appears in the content.",
  "tag.imeta.property":
    "More 'key value' pairs, such as 'm audio/mp4' (MIME type), 'duration 8' (seconds) or 'waveform 0 7 35 …' (amplitudes 0–100 for a preview).",
};

export const r6 = {
  n5A: {
    title: "Static Websites (nsites)",
    summary:
      "Host a static website on Nostr: a signed manifest maps each file path to the sha256 of a blob on Blossom servers, and a host server turns that into a normal website.",
    text: {
      "how.files.title": "A site is a list of files",
      "how.files.body":
        "Each file of the site is uploaded to a Blossom server, which stores it under its sha256 hash. The manifest event then lists one path tag per file: the path it should be served at and the hash of its contents.",
      "how.kinds.title": "Root site or named site",
      "how.kinds.body":
        "Kind 15128 is your root site: one per pubkey and no d tag. Kind 35128 is a named site, like a subdomain, with a short d tag (1–13 of a–z, 0–9 and '-', not ending in '-'). Older tools used kind 34128, which is now legacy.",
      "how.aggregate.title": "One hash for the whole version",
      "how.aggregate.body":
        "The x tag holds the aggregate hash: write '<sha256> <path>' plus a newline for each path tag, sort the lines, join them and hash the result. Two manifests with the same files get the same hash, whoever published them.",
      "how.host.title": "Host servers turn it into a website",
      "how.host.body":
        "A host server reads the left-most DNS label: an npub means the root site, 'v' plus 50 base36 characters means a snapshot, and 50 base36 characters plus the d tag means a named site.",
      "how.resolve.title": "Serving a path",
      "how.resolve.body":
        "For /blog/ the host looks for /blog/index.html, takes the hash from its path tag and downloads that blob from the manifest's server tags or the author's kind 10063 Blossom list. It should check the hash, and falls back to /404.html when a path is missing.",
      "how.history.title": "Copies and snapshots",
      "how.history.body":
        "Anyone can copy a site under their own key: a points at the site it was copied from and A at the original. A kind 5128 snapshot freezes one version so it can be linked by event id.",
      "related.B7":
        "The files live on Blossom servers; the kind 10063 list says where to find them.",
      "related.01":
        "Replaceable (15128), addressable (35128) and regular (5128) events come from NIP-01.",
      "related.19": "Root sites are addressed by the author's npub in the hostname.",
      "related.89":
        "The app tag can point at a NIP-89 application handler that the site belongs to.",
      "related.34": "The source tag may hold a NIP-34 nostr:// git URL.",
      "flow.publish.label": "Publish a site and keep a version",
      "flow.publish.explain":
        "Publish (or update) the named site, then publish a snapshot of it so this exact version stays reachable.",
      "flow.publish.named": "The named site manifest: d tag, path tags and the aggregate x tag.",
      "flow.publish.snapshot":
        "The snapshot copies the path tags and the x tag, and points at the site with an a tag.",
      "event.root.label": "Root site manifest",
      "event.root.explain":
        "Kind 15128, replaceable: the main website of a pubkey. It must not have a d tag.",
      "event.named.label": "Named site manifest",
      "event.named.explain":
        "Kind 35128, addressable: an extra site under the same pubkey, identified by its d tag.",
      "event.snapshot.label": "Manifest snapshot",
      "event.snapshot.explain":
        "Kind 5128, a regular event: an immutable copy of a site's files at one point in time. Its created_at is the version's date.",
      "content.empty": "Always empty: everything is in the tags.",
      "tag.path": "One file of the site: where it is served and which blob holds it.",
      "tag.path.path": "Absolute path ending in a file name, such as /index.html.",
      "tag.path.sha256": "sha256 of the file's contents, which is also its Blossom address.",
      "tag.x":
        "The aggregate hash of all path tags, so this site version can be indexed and looked up. Recommended on sites, required on snapshots.",
      "tag.x.hash": "Lower-case hex sha256 of the sorted '<sha256> <path>' lines.",
      "tag.x.marker": "Always the word 'aggregate'.",
      "tag.a":
        "For a copy: the site it was copied from. For a snapshot: the site it captures. Leave it out on an original site.",
      "tag.a.site": "Address of a 15128 or 35128 site manifest (kind:pubkey:d).",
      "tag.A":
        "For a copy: the original site at the start of the copy chain. Copied unchanged from copy to copy.",
      "tag.A.site": "Address of the original site manifest.",
      ...relayHint,
      "tag.server": "Blossom servers that should have the files. Hosts try these first.",
      "tag.server.url": "Base URL of a Blossom server.",
      "tag.title": "A human-readable title for the site.",
      "tag.title.value": "The title text.",
      "tag.description": "A short description of the site.",
      "tag.description.value": "The description text.",
      "tag.source": "Where the site's source code lives.",
      "tag.source.url": "An https:// git or archive URL, or a NIP-34 nostr:// git URL.",
      "tag.app": "An app descriptor (such as a NIP-89 handler) that this site is part of.",
      "tag.app.descriptor": "Address of the app descriptor event.",
      "tag.d": "The named site's identifier, which also becomes part of its hostname.",
      "tag.d.site": "1–13 characters of a–z, 0–9 and '-', not ending in '-'.",
      "example.homepage": "Alice's homepage",
      "example.homepage.explain":
        "Three files, the aggregate hash of those three, a Blossom server hint and a link to the source.",
      "example.blog": "Alice's blog",
      "example.blog.explain":
        "A named site 'blog', served at <alice's pubkey in base36>blog.<host>.",
      "example.copy": "Bob mirrors Alice's blog",
      "example.copy.explain":
        "Same files and the same aggregate hash, a new d tag, and a/A pointing back at Alice's site.",
      "example.blog-v1": "January snapshot of the blog",
      "example.blog-v1.explain":
        "Copies the path tags and x tag of Alice's blog. The version is identified by this event's id.",
    },
  },
  n7D: {
    title: "Forum Threads",
    summary:
      "Forum-style discussions: a kind 11 event with a title starts a thread, and every reply is a NIP-22 comment pointing at that thread.",
    text: {
      "how.thread.title": "Start a thread",
      "how.thread.body":
        "A thread is a kind 11 event. The content is the opening post, written like any note.",
      "how.title.title": "Give it a title",
      "how.title.body":
        "Threads should have a title tag, so forum clients can list them like topics on a message board.",
      "how.reply.title": "Replies are comments",
      "how.reply.body":
        "Replies must be kind 1111 comments from NIP-22, not kind 1 notes. They say what they reply to with tags, never in the content.",
      "how.flat.title": "Always reply to the thread",
      "how.flat.body":
        "Every reply points at the kind 11 thread as both root (E, K, P) and parent (e, k, p). That keeps discussions flat instead of deeply nested.",
      "how.fetch.title": "Loading a thread",
      "how.fetch.body":
        'A client fetches the thread by id, then its replies with a filter like {"kinds": [1111], "#E": [<thread id>]}.',
      "related.22": "Replies to threads are NIP-22 kind 1111 comments.",
      "related.C7":
        "NIP-C7 is the chat-style counterpart: short messages instead of titled threads.",
      "related.01": "Threads are ordinary signed events from NIP-01.",
      "flow.discussion.label": "A forum discussion",
      "flow.discussion.explain": "Alice opens a thread, Bob answers it with a comment.",
      "flow.discussion.thread": "The kind 11 thread with its title.",
      "flow.discussion.reply": "Bob's kind 1111 reply, pointing at the thread as root and parent.",
      "event.thread.label": "Thread",
      "event.thread.explain": "Kind 11: the first post of a forum thread.",
      "content.thread": "The opening post, in plain text.",
      "tag.title": "The thread's title, shown in thread lists.",
      "tag.title.value": "The title text.",
      "example.home-relays": "Alice asks about home relays",
      "example.home-relays.explain":
        "A thread with a title. Bob's reply below points at this event's id.",
      "example.gm": "A morning thread",
      "event.reply.label": "Reply (kind 1111)",
      "event.reply.explain": "A NIP-22 comment whose root and parent are both the kind 11 thread.",
      "content.reply": "The reply text.",
      ...commentRoot,
      ...commentParent,
      ...relayHint,
      "example.answer": "Bob answers",
      "example.answer.explain":
        "E/K/P name the thread as root, e/k/p as parent. For a reply to a thread they are the same.",
    },
  },
  nA0: {
    title: "Voice Messages",
    summary:
      "Short voice notes of up to about a minute: kind 1222 for a new message and kind 1244 for a voice reply, each pointing to an audio file.",
    text: {
      "how.record.title": "Record and upload",
      "how.record.body":
        "The app records a short clip, uploads it (for example to a Blossom server) and puts the file's URL in the content. The content is only the URL, nothing else.",
      "how.format.title": "Format and length",
      "how.format.body":
        "audio/mp4 (.m4a with AAC or Opus) is recommended because almost every device can play it; ogg, webm and mp3 may also work. Clips should be 60 seconds or less, and apps should warn when a recording is longer.",
      "how.preview.title": "Show a waveform before downloading",
      "how.preview.body":
        "An optional imeta tag can include a waveform (amplitudes 0–100, fewer than about 100 values) and the duration in seconds, so clients can draw the clip without downloading it.",
      "how.reply.title": "Reply with your voice",
      "how.reply.body":
        "A voice reply is kind 1244 and uses NIP-22 comment tags: E/K/P for the root message and e/k/p for the one you answer.",
      "related.22": "Kind 1244 replies follow the NIP-22 comment structure.",
      "related.92": "The waveform and duration ride in a NIP-92 imeta tag.",
      "related.B7": "Audio files are usually stored on Blossom servers.",
      "flow.conversation.label": "A voice conversation",
      "flow.conversation.explain": "Bob posts a voice note and Carol answers with one of her own.",
      "flow.conversation.voice": "Bob's kind 1222 message with a waveform preview.",
      "flow.conversation.reply": "Carol's kind 1244 reply pointing at Bob's message.",
      "event.voice.label": "Voice message",
      "event.voice.explain": "Kind 1222: a new, top-level voice message.",
      "content.audio": "Exactly one URL that points directly at the audio file.",
      ...imeta,
      "tag.t": "A hashtag, as in any other note.",
      "tag.t.value": "The hashtag, without '#'.",
      "tag.g": "A geohash, if the message is about a place.",
      "tag.g.value": "Geohash characters (0–9 and letters except a, i, l, o).",
      "example.intro": "Bob says hello",
      "example.intro.explain":
        "An 8-second m4a clip with a waveform, so clients can draw it before playing.",
      "example.plain": "Just the audio",
      "event.reply.label": "Voice reply",
      "event.reply.explain": "Kind 1244: a voice answer, threaded with NIP-22 comment tags.",
      ...commentRoot,
      ...commentParent,
      ...relayHint,
      "example.answer": "Carol answers by voice",
      "example.answer.explain": "A top-level reply: Bob's message is both the root and the parent.",
    },
  },
  nA3: {
    title: "payto: Payment Targets",
    summary:
      "A kind 10133 list of the ways people can pay you, such as Bitcoin, Lightning or PayPal, each written as a payto tag with a type and an address.",
    text: {
      "how.list.title": "One list per person",
      "how.list.body":
        "Kind 10133 is replaceable: you publish one list with every way to pay you, and a new version replaces the old one.",
      "how.tag.title": "One tag per address",
      "how.tag.body":
        'Each payment address is a tag: ["payto", <type>, <address>]. Add as many as you like.',
      "how.type.title": "The type is lower case",
      "how.type.body":
        "The type names the network or service: bitcoin, lightning, monero, paypal and so on. The NIP lists common ones, but any lower-case type is allowed.",
      "how.render.title": "Turning it into a link",
      "how.render.body":
        "Clients show each target as a button. If the network has a URI scheme they use it (bitcoin:<address>); otherwise they use RFC 8905: payto://<type>/<address>.",
      "related.57":
        "Zaps (NIP-57) are Lightning payments tied to a note; payto is a plain list of addresses.",
      "related.47":
        "Nostr Wallet Connect (NIP-47) lets an app pay for you; payto only says where to send money.",
      "related.01": "Kind 10133 is a replaceable event as defined in NIP-01.",
      "event.targets.label": "Payment targets",
      "event.targets.explain": "Kind 10133: your list of payment addresses.",
      "content.empty": "Empty: the addresses are in the tags.",
      "tag.payto": "One way to pay you.",
      "tag.payto.type":
        "Payment type, always lower case. Pick a common one or type your own; unknown types still work through payto://.",
      "type.bip352": "Bitcoin silent payment address (BIP-352).",
      "type.bip353": "Human-readable Bitcoin address in DNS, like ₿alice@example.com (BIP-353).",
      "type.cashme": "Cash App cashtag, starting with $.",
      "type.lightning": "Lightning address, like alice@wallet.example.",
      "tag.payto.address": "The address, username or account for that type.",
      "example.wallets": "Alice's wallets",
      "example.wallets.explain":
        "Bitcoin opens as bitcoin:<address>, the others fall back to payto://lightning/… and payto://cashme/….",
      "example.unknown": "A type not on the list",
      "example.unknown.explain":
        "iban is not one of the common types, so the editor warns, but clients can still render payto://iban/DE89….",
    },
  },
  nA4: {
    title: "Public Messages",
    summary:
      "Kind 24 is a short public message addressed to one or more people, shown in their notifications rather than in feeds, with no threads and no privacy.",
    text: {
      "how.message.title": "A message to someone, in public",
      "how.message.body":
        "Kind 24 holds a plain-text message in the content. It is signed and public, a bit like a postcard.",
      "how.receivers.title": "p tags name the receivers",
      "how.receivers.body": "Add one p tag for each person the message is for.",
      "how.relays.title": "Delivered to inboxes",
      "how.relays.body":
        "The sender publishes it to each receiver's NIP-65 inbox relays and to their own outbox relays, so receivers find it without following the sender.",
      "how.no-threads.title": "No threads",
      "how.no-threads.body":
        "There are no roots, replies or chat rooms. Each message stands alone and is answered from the notification screen, so e tags must not be used.",
      "how.expire.title": "Let it expire",
      "how.expire.body":
        "Without a conversation around them these messages age badly, so a NIP-40 expiration tag is recommended.",
      "how.public.title": "Not private",
      "how.public.body":
        "Anyone can read kind 24. For private messages use NIP-17 instead; its kind 14 messages are sealed and gift-wrapped.",
      "related.65": "Messages are sent to the receivers' NIP-65 inbox relays.",
      "related.40": "An expiration tag (NIP-40) is recommended.",
      "related.18": "q tags (NIP-18) can cite other events mentioned in the content.",
      "related.17": "NIP-17 is the private alternative. Do not confuse kind 24 with kind 14.",
      "event.message.label": "Public message",
      "event.message.explain": "Kind 24: a public message to the people in its p tags.",
      "content.message": "The message, in plain text.",
      "tag.p": "A receiver of the message.",
      "tag.p.pubkey": "The receiver's pubkey.",
      ...relayHint,
      "tag.expiration": "When relays and clients may drop the message (NIP-40).",
      "tag.expiration.at": "Unix time in seconds.",
      "tag.q": "An event quoted in the content with a nostr: link (NIP-18).",
      "tag.q.target": "Either an event id or an address (kind:pubkey:d).",
      "tag.q.pubkey": "Author of the quoted event, when it is a regular event.",
      ...imeta,
      "tag.e": "Not allowed in kind 24: these messages never point at a thread or a parent.",
      "tag.e.id": "An event id. Use a q tag to cite an event instead.",
      "example.thanks": "Alice thanks Bob",
      "example.thanks.explain": "One receiver, and an expiration a week later.",
      "example.quote": "Carol shares an article",
      "example.quote.explain": "Two receivers, and a q tag for the article linked in the content.",
    },
  },
  nB0: {
    title: "Web Bookmarks",
    summary:
      "Save and share web bookmarks as kind 39701 events: the d tag is the bookmarked URL, and you can edit the title, tags and notes later.",
    text: {
      "how.address.title": "The URL is the address",
      "how.address.body":
        "Kind 39701 is addressable and its d tag is the bookmarked URL, so each person has at most one bookmark per URL and saving it again updates it.",
      "how.scheme.title": "Drop https://",
      "how.scheme.body":
        "For https URLs, leave out everything before the host name: 'https://example.com/post' becomes 'example.com/post'. Other schemes keep their prefix. Everyone writes the same d tag, so clients can search bookmarks by URL.",
      "how.describe.title": "Add notes",
      "how.describe.body":
        "The content holds your description of the page and can be empty. A title tag, t tags for topics and a published_at date are optional.",
      "how.edit.title": "Edit any time",
      "how.edit.body":
        "Publish the same d tag again with new tags or text; relays keep only the newest version.",
      "how.comments.title": "Comments",
      "how.comments.body": "Comments on a bookmark must be NIP-22 kind 1111 comments.",
      "related.01": "Kind 39701 is addressable, as defined in NIP-01.",
      "related.22": "Comments on bookmarks are NIP-22 comments.",
      "related.51": "NIP-51 bookmark lists collect notes; NIP-B0 saves web pages, one event each.",
      "event.bookmark.label": "Web bookmark",
      "event.bookmark.explain": "Kind 39701: one bookmarked web address with your notes.",
      "content.bookmark": "Your description of the page. May be empty.",
      "tag.d": "The bookmarked URI, which is also this event's identifier.",
      "tag.d.uri": "The URL without 'https://' (other schemes like http:// stay).",
      "tag.title": "The page title, usable as the text of a link.",
      "tag.title.value": "The title text.",
      "tag.published_at": "When you first bookmarked it. Stays the same when you edit.",
      "tag.published_at.at": "Unix time in seconds, as a string.",
      "tag.t": "A topic or hashtag for the bookmark.",
      "tag.t.value": "The topic, without '#'.",
      "example.nips": "Alice saves the NIPs repo",
      "example.nips.explain":
        "An https URL, so the d tag starts at the host name. Two topics and a first-saved date.",
      "example.http": "An old http page",
      "example.http.explain": "Plain http keeps its scheme in the d tag. No notes this time.",
    },
  },
  nB7: {
    title: "Blossom",
    summary:
      "Use Blossom servers for media: files are stored and found by their sha256 hash, and your kind 10063 server list tells others where to look when a link stops working.",
    text: {
      "how.hash.title": "Files are named by their hash",
      "how.hash.body":
        "A Blossom server stores a file under its sha256 hash, so a URL looks like https://server/<64 hex characters>.png. The hash identifies the file whichever server holds it.",
      "how.servers.title": "Publish your server list",
      "how.servers.body":
        "A kind 10063 event lists the Blossom servers you upload to, in order of preference.",
      "how.fallback.title": "When a link breaks",
      "how.fallback.body":
        "If a URL in someone's event ends with a 64-character hex hash and no longer works, the client reads that person's kind 10063 list and requests the same hash (with the extension) from those servers.",
      "how.verify.title": "Check the download",
      "how.verify.body":
        "Since the name is the hash, the client should hash what it downloaded and compare. A server cannot swap the file without being caught.",
      "how.upload.title": "Uploading needs a signed permission",
      "how.upload.body":
        "To upload, the client signs a short-lived kind 24242 event (verb 'upload', the file's hash, an expiration) and sends it base64-encoded as 'Authorization: Nostr …'.",
      "related.92": "imeta tags (NIP-92) describe media URLs, including their hash.",
      "related.94": "NIP-94 file metadata events can point at Blossom blobs.",
      "related.96":
        "NIP-96 is an older HTTP file-storage API; Blossom is the simpler, hash-based option.",
      "related.98":
        "NIP-98 signs HTTP requests with kind 27235; Blossom uses its own kind 24242 in the same way.",
      "flow.publish-and-find.label": "Upload, then find it anywhere",
      "flow.publish-and-find.explain":
        "Alice uploads a file with a signed permission, lists her servers, and anyone can find the file again by its hash.",
      "flow.publish-and-find.auth": "Alice signs a kind 24242 permission for this one upload.",
      "flow.publish-and-find.upload":
        "The client PUTs the file with the permission in the Authorization header.",
      "flow.publish-and-find.servers": "Her kind 10063 list says which servers hold her files.",
      "flow.publish-and-find.fetch": "A reader fetches the hash from another server on that list.",
      "event.servers.label": "Blossom server list",
      "event.servers.explain": "Kind 10063, replaceable: the servers you store your files on.",
      "content.empty": "Empty: the servers are in the tags.",
      "tag.server": "A Blossom server you use, most preferred first.",
      "tag.server.url": "The server's base URL (https://…).",
      "example.two-servers": "Alice's servers",
      "example.two-servers.explain": "Her own server first and a mirror second.",
      "event.auth.label": "Authorization event",
      "event.auth.explain":
        "Kind 24242 (Blossom BUD-01): a signed permission for one action on a server. It is sent in an HTTP header, not published to relays.",
      "content.auth": "A human-readable description of the action, shown to the user.",
      "tag.t": "Which action this permission allows.",
      "tag.t.verb": "The action: get, upload, list or delete.",
      "verb.get": "Download a blob.",
      "verb.upload": "Upload a new blob.",
      "verb.list": "List your blobs on the server.",
      "verb.delete": "Delete a blob.",
      "tag.expiration": "After this time the server must reject the permission.",
      "tag.expiration.at": "Unix time in seconds. Keep it a few minutes in the future.",
      "tag.x": "The hash of the blob the action is about. Needed for upload and delete.",
      "tag.x.sha256": "sha256 of the file, hex.",
      "tag.auth-server": "Limits the permission to this server, so it cannot be reused elsewhere.",
      "example.upload": "Permission to upload a voice note",
      "example.upload.explain": "Valid for one hour, for exactly one file hash.",
      "http.fetch.label": "GET /<sha256>",
      "http.fetch.explain":
        "Download a blob by its hash, with an optional file extension. No authorization is needed for public files.",
      "http.fetch.200": "The file. Check that its sha256 matches the hash in the URL.",
      "http.fetch.404": "This server does not have it: try the next server on the author's list.",
      "example.mirror": "Fetch from the mirror",
      "example.mirror.explain":
        "The original link broke, so the client tries the same hash on Alice's second server.",
      "http.upload.label": "PUT /upload",
      "http.upload.explain":
        "Upload a file (BUD-02). The body is the raw file and the Authorization header carries the signed kind 24242 event.",
      "header.authorization": "'Nostr ' followed by the base64-encoded, signed kind 24242 event.",
      "header.content-type": "The file's MIME type, such as audio/mp4.",
      "http.upload.200": "Stored. The server answers with a blob descriptor.",
      descriptor: "A blob descriptor: where the file now lives and what it is.",
      "descriptor.url": "Public URL of the blob on this server.",
      "descriptor.sha256": "The file's sha256, which is also its name.",
      "descriptor.size": "Size in bytes.",
      "descriptor.type": "MIME type.",
      "descriptor.uploaded": "Upload time, Unix seconds.",
      "http.upload.401": "Missing, expired or invalid authorization event.",
      "example.voice-note": "Upload with authorization",
      "example.voice-note.explain":
        "The header holds Alice's signed kind 24242 event. Decode the base64 to see the JSON.",
    },
  },
  nBE: {
    title: "Nostr BLE Communications Protocol",
    summary:
      "Unrecommended. Two nearby devices sync Nostr events over Bluetooth Low Energy without internet: one acts as a relay, the other as a client, using NIP-77 to work out what is missing.",
    text: {
      "how.status.title": "Unrecommended",
      "how.status.body":
        "This NIP has been implemented only once and needs review, so it is marked unrecommended. It names no replacement. Online, use ordinary relays and NIP-77 sync.",
      "how.advertise.title": "Find each other",
      "how.advertise.body":
        "Each device advertises a BLE service (UUID 0000180f-…) with its own device UUID as data.",
      "how.roles.title": "Pick a relay and a client",
      "how.roles.body":
        "The device with the higher UUID becomes the GATT server and plays the relay; the other one is the client. A device that always wants one role uses all-F or all-zero as its UUID.",
      "how.chunks.title": "Small packets",
      "how.chunks.body":
        "Each NIP-01 message is DEFLATE-compressed and split into chunks: a 2-byte index, the data, and a last-chunk flag byte. Messages are limited to 64 KB and only one is in flight at a time.",
      "how.sync.title": "Sync with NIP-77",
      "how.sync.body":
        "The client opens a NIP-77 negentropy session, then the two take turns: write, write-success, read-message, reply. Each turn sends one missing EVENT or EOSE, until both sides have everything.",
      "how.spread.title": "Pass on new events",
      "how.spread.body":
        "While connected, a device that gets a new event forwards it to peers that lack it. The relay side first sends an empty notification so the client knows to read.",
      "related.77": "Sync uses NIP-77 negentropy messages (NEG-OPEN, NEG-MSG), run half-duplex.",
      "related.01": "Every message on the wire is a normal NIP-01 message, compressed and chunked.",
      "actor.phone": "Device A (GATT client)",
      "actor.peer": "Device B (GATT server, acts as relay)",
      "step.advertise.label": "Advertise",
      "step.advertise.explain": "Device B broadcasts the service UUID and its device UUID.",
      "step.roles.label": "Compare UUIDs",
      "step.roles.explain":
        "Device A reads B's UUID. B's is higher, so B is the server (relay) and A connects as client.",
      "step.neg-open.label": "Write NEG-OPEN",
      "step.neg-open.explain":
        "A writes a NIP-77 NEG-OPEN with a filter and its first negentropy message to the write characteristic.",
      "step.write-success.label": "write-success",
      "step.write-success.explain": "B confirms the write. Only one message moves at a time.",
      "step.read.label": "read-message",
      "step.read.explain": "A asks to read B's answer from the read characteristic.",
      "step.neg-msg.label": "NEG-MSG",
      "step.neg-msg.explain":
        "B answers with its negentropy message: now both know which events differ.",
      "step.send-event.label": "Write one EVENT",
      "step.send-event.explain":
        "A sends one event that B is missing (or EOSE when it has none left), then reads again.",
      "step.receive.label": "EVENT or EOSE back",
      "step.receive.explain":
        "B returns one event A is missing, or EOSE when it has none. The turns repeat until both are in sync.",
      "step.notify.label": "Notify on something new",
      "step.notify.explain":
        "Later, when B gets a new event from another peer, it sends an empty notification. A reads and receives the EVENT.",
    },
  },
  nC0: {
    title: "Code Snippets",
    summary:
      "Share code as kind 1337 events: the content is the code, and tags give the language, file name, license, dependencies and source repository.",
    text: {
      "how.code.title": "The code is the content",
      "how.code.body":
        "Put the snippet in the content exactly as written. Clients keep whitespace and indentation and offer one-click copy.",
      "how.language.title": "Say what it is",
      "how.language.body":
        "An l tag with the lower-case language name and an extension tag (without the dot) let clients highlight the code and save it as a file.",
      "how.license.title": "License it",
      "how.license.body":
        "Use SPDX identifiers like MIT or Apache-2.0. Repeat the license tag to offer several licenses; the reader may pick any of them.",
      "how.repo.title": "Link the source",
      "how.repo.body":
        "The repo tag points at where the code comes from: a normal URL, or the address of a NIP-34 git repository event plus a relay hint.",
      "how.client.title": "What clients do",
      "how.client.body":
        "Clients should highlight syntax, show language and description, and may let you run, edit, fork or download the snippet.",
      "related.34": "repo can point at a NIP-34 repository announcement (kind 30617).",
      "related.01": "A snippet is a regular NIP-01 event.",
      "event.snippet.label": "Code snippet",
      "event.snippet.explain": "Kind 1337: a piece of code plus what you need to use it.",
      "content.code": "The code itself.",
      "tag.l": "Programming language.",
      "tag.l.value": "Lower-case language name, such as javascript, python or rust.",
      "tag.name": "Name of the snippet, usually a file name.",
      "tag.name.value": "For example hello-world.js.",
      "tag.extension": "File extension, used to highlight and download the snippet.",
      "tag.extension.value": "Without the dot: js, py, rs.",
      "tag.description": "What the code does, in a sentence.",
      "tag.description.value": "The description text.",
      "tag.runtime": "Runtime or environment it was written for.",
      "tag.runtime.value": "For example 'node v22.11.0' or 'python 3.12'.",
      "tag.license": "License of the code. Repeat for multiple licenses.",
      "tag.license.spdx": "An SPDX short identifier: MIT, GPL-3.0-or-later, Apache-2.0…",
      "tag.license.reference": "Optional link to the full license text.",
      "tag.dep": "Something the code needs to run. Repeat for each dependency.",
      "tag.dep.value": "A package name, optionally with a version.",
      "tag.repo": "Where the code comes from.",
      "tag.repo.target": "A URL, or a NIP-34 repository address '30617:<pubkey>:<d tag>'.",
      ...relayHint,
      "example.hello": "Hello, Nostr in JavaScript",
      "example.hello.explain": "Language, file name, runtime, license and a repository URL.",
      "example.python": "Bob's quicksort",
      "example.python.explain":
        "Two licenses (pick either) and a repo tag pointing at a NIP-34 repository with a relay hint.",
    },
  },
  nC7: {
    title: "Chats",
    summary:
      "Kind 9 is a chat message. To reply, send another kind 9 that quotes the earlier message with a q tag, so chats stay a simple ordered stream.",
    text: {
      "how.message.title": "A chat message",
      "how.message.body":
        "A kind 9 event whose content is the message text. Nothing else is required.",
      "how.quote.title": "Reply by quoting",
      "how.quote.body":
        "A reply is another kind 9 with a q tag naming the message it answers: id, relay hint and author.",
      "how.mention.title": "Show the quote inline",
      "how.mention.body":
        "The reply's content usually starts with a nostr:nevent link to the parent, so clients render the quoted message above the reply.",
      "how.stream.title": "One stream, one kind",
      "how.stream.body":
        "Clients that show a chat as an ordered stream must fetch only kind 9, so every app sees the same messages. Other content can be quoted (NIP-18) but is not part of the stream.",
      "related.18": "Quotes use NIP-18 q tags.",
      "related.21": "The nostr:nevent link in the content is a NIP-21 URI.",
      "related.29": "NIP-29 relay-based groups use kind 9 for their chat messages.",
      "related.7D": "NIP-7D forum threads are the long-form counterpart.",
      "event.chat.label": "Chat message",
      "event.chat.explain": "Kind 9: one message in a chat.",
      "content.chat":
        "The message text. A reply may start with a nostr: link to the quoted message.",
      "tag.q": "The message this one replies to (a quote).",
      "tag.q.id": "Id of the quoted message.",
      ...relayHint,
      "tag.q.pubkey": "Author of the quoted message.",
      "example.gm": "Alice says GM",
      "example.gm.explain": "The simplest chat message: content and no tags.",
      "example.reply": "Bob replies",
      "example.reply.explain":
        "The q tag points at Alice's message and the content starts with its nevent so it is shown inline.",
    },
  },
  nCC: {
    title: "Geocaching",
    summary:
      "Geocaching on Nostr: hide a cache as a kind 37516 listing, log finds as kind 7516, prove you were there with a kind 7517 event signed by the cache's own key, and group caches into trails.",
    text: {
      "how.hide.title": "Hide a cache",
      "how.hide.body":
        "The owner publishes a kind 37516 listing: name, location, difficulty, terrain and size are required; the description goes in the content.",
      "how.where.title": "Location as geohashes",
      "how.where.body":
        "g tags hold the geohash. Add several precisions (3–9 characters) so apps can search nearby; clients should require at least 8 characters, 9 for micro caches.",
      "how.log.title": "Log a find",
      "how.log.body":
        "A finder publishes a kind 7516 found log with an a tag pointing at the listing.",
      "how.prove.title": "Prove you were there",
      "how.prove.body":
        "A cache with a verification tag hides a private key at the spot, often as a QR code. The finder scans it and signs a kind 7517 event with that key, naming their own npub and the cache. Embedding that event in the found log proves the visit.",
      "how.dnf.title": "Didn't find it?",
      "how.dnf.body":
        "Other logs are NIP-22 kind 1111 comments on the listing, with a t tag: dnf, note, maintenance, or archived (owner only, to retire a cache).",
      "how.trail.title": "Trails",
      "how.trail.body":
        "A kind 37517 curation list groups caches, from any author and in a set order, into a trail or treasure hunt.",
      "related.22": "Non-found logs are NIP-22 comments on the listing.",
      "related.19": "Proofs name the finder by npub and the cache by naddr (NIP-19).",
      "related.52": "Like NIP-52 calendar events, listings are addressable events tied to a place.",
      "related.01": "Listings and lists are addressable events (NIP-01).",
      "flow.verified-find.label": "A verified find",
      "flow.verified-find.explain":
        "Frank hides a cache with a verification key, Alice finds it, signs a proof with the cache key and logs it.",
      "flow.verified-find.listing": "Frank's listing includes the verification pubkey.",
      "flow.verified-find.proof":
        "Alice uses the key from the QR code to sign a kind 7517 proof naming her.",
      "flow.verified-find.found": "Her found log embeds that proof as JSON in a verification tag.",
      "event.listing.label": "Geocache listing",
      "event.listing.explain": "Kind 37516, addressable: one hidden cache.",
      "content.listing": "Description of the cache and anything finders should know.",
      "tag.d": "Unique identifier of this cache among the owner's caches.",
      "tag.d.value": "Any text; it ends up in the cache's address.",
      "tag.name": "The cache's name.",
      "tag.name.value": "The name text.",
      "tag.g": "Geohash of the location. Repeat with different precisions.",
      "tag.g.value": "Geohash characters (0–9 and letters except a, i, l, o).",
      "tag.D": "Difficulty: how hard the cache is to find or solve.",
      "tag.T": "Terrain: how hard the place is to reach.",
      "tag.rating.score": "A whole number from 1 (easy) to 5 (hard).",
      "tag.S": "Container size.",
      "tag.S.size": "One of micro, small, regular, large, other.",
      "size.micro": "Tiny, like a film canister.",
      "size.small": "Fits a few small items.",
      "size.regular": "About a shoebox.",
      "size.large": "Bigger than a shoebox.",
      "size.other": "Doesn't fit the usual sizes.",
      "tag.t": "Cache type. If missing, it is traditional.",
      "tag.t.type": "traditional, multi, mystery or another type; archived marks a retired cache.",
      "type.traditional": "The box is at the listed location.",
      "type.multi": "Several stages lead to the box.",
      "type.mystery": "Solve a puzzle to get the location.",
      "type.archived": "The owner has retired this cache.",
      "tag.n": "A modifier that changes how the cache behaves. At most one per category.",
      "tag.n.modifier": "first-to-find or art; unknown modifiers are ignored.",
      "modifier.first-to-find":
        "Only the first verified finder claims it. Needs a verification tag.",
      "modifier.art": "The cache itself is a work of art.",
      "tag.hint": "A plain-text hint. Clients may hide it with ROT13 to avoid spoilers.",
      "tag.hint.value": "The hint text.",
      "tag.mission": "A 'Key Quest': what finders must do to claim the cache. Only one is allowed.",
      "tag.mission.value": "The mission text.",
      "tag.image": "A photo.",
      "tag.image.url": "Image URL.",
      "tag.r": "A relay where logs for this cache should be published.",
      "tag.r.relay": "Relay URL.",
      "tag.verification": "Public key of the cache's verification key, for verified finds.",
      "tag.verification.pubkey": "The pubkey, hex. Its private key is hidden at the cache.",
      "tag.F": "Locks in the first-to-find winner, added by the owner when archiving the cache.",
      "tag.F.winner": "Pubkey of the winning finder.",
      "example.old-oak": "A traditional cache",
      "example.old-oak.explain":
        "Three geohash precisions, a ROT13 hint ('Look among the roots') and a verification key.",
      "example.linocut": "First-to-find art",
      "example.linocut.explain": "Two modifiers from different categories and a Key Quest mission.",
      "event.found.label": "Found log",
      "event.found.explain": "Kind 7516: 'I found it'.",
      "content.log": "The log message.",
      "tag.a": "The cache you found.",
      "tag.a.cache": "Address of the listing: 37516:<owner pubkey>:<d tag>.",
      ...relayHint,
      "tag.found-verification": "Proof that you were at the cache: the signed kind 7517 event.",
      "tag.found-verification.proof":
        "The kind 7517 event as a JSON string, signed by the cache key.",
      "example.verified": "Alice's verified find",
      "example.verified.explain":
        "The verification tag contains a real proof signed with the cache key. Its a tag names Alice, the author of this log.",
      "example.simple": "A simple find",
      "event.proof.label": "Proof of find",
      "event.proof.explain":
        "Kind 7517, signed with the cache's verification key (here grace's demo key), not the finder's.",
      "content.proof": "Exactly 'Geocache verification for <finder npub>'.",
      "tag.proof-a": "Who found which cache.",
      "tag.proof-a.value": "<finder pubkey hex>:<naddr of the cache listing>.",
      "example.proof": "Proof for Alice",
      "example.proof.explain":
        "Signed with the key from the QR code, naming Alice's npub and the cache's naddr.",
      "event.comment.label": "Log comment",
      "event.comment.explain":
        "Kind 1111 (NIP-22): logs that are not finds. The listing is both root and parent.",
      "tag.root.a": "A: the listing, as the root of the comment thread.",
      "tag.root.a.addr": "Address of the listing.",
      "tag.root.k": "K: always 37516.",
      "tag.root.k.kind": "The listing kind.",
      "tag.root.p": "P: the cache owner.",
      "tag.root.p.pubkey": "Owner's pubkey.",
      "tag.parent.a": "a: the listing again, as the direct parent.",
      "tag.parent.a.addr": "Address of the listing.",
      "tag.parent.k": "k: always 37516.",
      "tag.parent.k.kind": "The listing kind.",
      "tag.parent.p": "p: the cache owner, so they are notified.",
      "tag.parent.p.pubkey": "Owner's pubkey.",
      "tag.log-type": "Log type. Without it the log is a note.",
      "tag.log-type.type": "dnf, note, maintenance or archived.",
      "log.dnf": "Did not find it.",
      "log.note": "Useful or neutral information.",
      "log.maintenance": "The cache needs attention.",
      "log.archived": "The owner retires the cache; its history stays.",
      "example.dnf": "Bob didn't find it",
      "example.dnf.explain": "Several DNFs in a row tell others the cache may be missing.",
      "example.archive": "Frank retires the cache",
      "example.archive.explain": "Only the owner's archived log retires a cache.",
      "event.curation.label": "Curation list",
      "event.curation.explain": "Kind 37517, addressable: an ordered trail of caches.",
      "content.curation": "Full description: rules, tips or story.",
      "tag.title": "Name of the list.",
      "tag.title.value": "The title text.",
      "tag.curation-a": "A cache on the trail. Order matters.",
      "tag.curation-a.cache": "Address of a listing by any author.",
      "tag.description": "Short summary for cards and browse views.",
      "tag.description.value": "The summary text.",
      "tag.theme": "Default page theme for the list.",
      "tag.theme.value": "adventure or mojave.",
      "tag.map": "Default map style.",
      "tag.map.value": "original, dark, satellite or adventure.",
      "example.park-trail": "Frank's park trail",
      "example.park-trail.explain": "Two of Frank's caches in order, with a theme and map style.",
    },
  },
  nEE: {
    title: "E2EE Messaging using MLS Protocol",
    summary:
      "Unrecommended, superseded by the Marmot Protocol. Defined end-to-end encrypted direct and group chats on Nostr using MLS (RFC 9420), with forward secrecy and post-compromise security.",
    text: {
      "how.status.title": "Superseded by Marmot",
      "how.status.body":
        "This NIP is marked unrecommended: its work continues as the Marmot Protocol (github.com/marmot-protocol/marmot). Read this page to understand the design, and build new apps on Marmot.",
      "how.why.title": "Why MLS",
      "how.why.body":
        "NIP-17 hides who talks to whom but uses long-term keys: leak one and all messages are readable. MLS keeps changing the group keys, so old messages stay safe (forward secrecy) and the group recovers after a leak (post-compromise security), even in large groups.",
      "how.key-package.title": "Publish a KeyPackage",
      "how.key-package.body":
        "To be invitable, you publish a kind 443 KeyPackage with your MLS version, ciphersuite and extensions. Its MLS signing key must differ from your Nostr key. Kind 10051 lists the relays where you publish them.",
      "how.welcome.title": "Get welcomed",
      "how.welcome.body":
        "A group member adds you with an MLS Commit and sends you a kind 444 Welcome. The Welcome is never signed and travels gift-wrapped (NIP-59). Its e tag names the KeyPackage that was used.",
      "how.group.title": "Group messages",
      "how.group.body":
        "Every group message is kind 445 from a fresh, throwaway key. Only the h tag (the Nostr group id) is visible. The content is NIP-44 encrypted with a key derived from the epoch's MLS exporter secret; inside are unsigned Nostr events, such as kind 9 chats.",
      "how.commits.title": "Competing commits",
      "how.commits.body":
        "If two Commits arrive for the same epoch, the one with the lower created_at wins (then the lower id). Senders wait for a relay to acknowledge a Commit before applying it.",
      "related.17": "NIP-17 private DMs: simpler, but no forward secrecy or efficient groups.",
      "related.44": "Group events are NIP-44 encrypted under a key from the MLS exporter secret.",
      "related.59": "Welcome events are sealed and gift-wrapped (NIP-59).",
      "related.70": "KeyPackages can carry the '-' protected tag (NIP-70).",
      "related.C7": "Decrypted application messages are usually kind 9 chats (NIP-C7).",
      "flow.join.label": "Joining a group",
      "flow.join.explain":
        "Bob makes himself reachable, Alice adds him, and he reads the group's messages.",
      "flow.join.relays": "Bob lists where his KeyPackages live (kind 10051).",
      "flow.join.key-package": "Bob publishes a KeyPackage (kind 443).",
      "flow.join.welcome":
        "Alice commits the add and sends him an unsigned, gift-wrapped Welcome (kind 444).",
      "flow.join.group": "Now Bob can decrypt the group's kind 445 events.",
      "event.key-package.label": "KeyPackage",
      "event.key-package.explain":
        "Kind 443, signed with your Nostr key: what others need to add you to an MLS group.",
      "content.key-package":
        "The serialized MLS KeyPackageBundle, hex. Here a short stand-in, not a real KeyPackage.",
      "tag.mls_protocol_version": "MLS protocol version.",
      "tag.mls_protocol_version.value": "Currently always 1.0.",
      "tag.ciphersuite": "The MLS ciphersuite this KeyPackage supports.",
      "tag.ciphersuite.id": "Ciphersuite id as hex, such as 0x0001.",
      "tag.extensions": "MLS extensions this KeyPackage supports.",
      "tag.extensions.id":
        "Extension ids, such as 0x0002 (ratchet_tree), 0x0003 (required_capabilities) or 0x000a (last_resort).",
      "tag.client":
        "Which app made this KeyPackage, so others can tell you where to accept invites.",
      "tag.client.name": "App name.",
      "tag.client.handler": "Optional id of the app's NIP-89 handler event.",
      "tag.client.relay": "Optional relay for that handler event.",
      "tag.relays": "Relays this KeyPackage is published to, so it can be deleted later.",
      "tag.relays.relay": "A relay URL.",
      "tag.protected": "NIP-70 '-' tag: relays only accept this event from its author.",
      "example.bob-package": "Bob's KeyPackage",
      "example.bob-package.explain":
        "A last-resort KeyPackage published to two relays. The Welcome below points at this event's id.",
      "event.key-package-relays.label": "KeyPackage relays",
      "event.key-package-relays.explain":
        "Kind 10051, replaceable: where to find your KeyPackages.",
      "content.empty": "Empty: the relays are in the tags.",
      "tag.relay": "A relay that holds your KeyPackages.",
      "tag.relay.url": "Relay URL.",
      "example.bob-relays": "Bob's KeyPackage relays",
      "event.welcome.label": "Welcome",
      "event.welcome.explain":
        "Kind 444, never signed (a rumor): gift-wrapped to the new member after the Commit that adds them.",
      "content.welcome": "The serialized MLS Welcome message. Here a short stand-in.",
      "tag.e": "The KeyPackage used to add you.",
      "tag.e.id": "Id of that kind 443 event.",
      "tag.welcome-relays": "Relays where the group's kind 445 events are published.",
      "example.welcome-bob": "Alice welcomes Bob",
      "example.welcome-bob.explain":
        "Unsigned on purpose: if it leaked it could not be published. It is sealed and gift-wrapped before sending.",
      "event.group-event.label": "Group event",
      "event.group-event.explain":
        "Kind 445: every group message (Proposals, Commits and application messages), signed by a fresh throwaway key.",
      "content.group-event":
        "NIP-44 payload. The conversation key comes from the epoch's exporter secret, used as a private key with its own public key.",
      "content.mls-message":
        "A serialized MLSMessage. Application messages contain unsigned Nostr events with no h tag.",
      "tag.h": "The Nostr group id, the only group metadata relays see.",
      "tag.h.id": "32-byte hex group id. It is not the MLS group id and admins can change it.",
      "example.application": "A group message",
      "example.application.explain":
        "Encrypted under a demo exporter secret. In the demo grace's key signs it; real clients use a new random key for every event.",
    },
  },
  nF4: {
    title: "Podcasts",
    summary:
      "Podcasts as Nostr feeds: each show has its own keypair, publishes kind 10154 show info and one kind 54 event per episode, and hosts confirm they author it with kind 10164.",
    text: {
      "how.keypair.title": "A podcast is a keypair",
      "how.keypair.body":
        "Each show gets its own Nostr key. It can post normal notes too, and the key can be shared or handed over to change ownership.",
      "how.show.title": "Show information",
      "how.show.body":
        "Kind 10154 (replaceable) holds the title, cover image, description, websites and the people behind the show with their roles.",
      "how.episode.title": "One event per episode",
      "how.episode.body":
        "Each episode is a kind 54 event signed by the podcast key: title, image, description and one or more audio tags, with show notes as Markdown in the content. Episodes can be fetched, paged and shared one by one, unlike an RSS file.",
      "how.authors.title": "Confirm authorship",
      "how.authors.body":
        "Anyone can name you as a host, so clients check the other side: your own kind 10164 event lists the podcasts you make. (The NIP's sample JSON says 10064, but its text says 10164.)",
      "how.listen.title": "Listen and interact",
      "how.listen.body":
        "Because episodes are Nostr events, listeners can like, comment on or zap them, and favorite shows can be listed with NIP-51 (kind 10054).",
      "related.51": "NIP-51 kind 10054 lists the podcasts you recommend.",
      "related.B7": "Audio files can be hosted on Blossom servers.",
      "related.25": "Listeners react to episodes like any other event.",
      "related.01": "All three kinds are ordinary NIP-01 events.",
      "flow.authorship.label": "Verified hosts",
      "flow.authorship.explain":
        "The show claims its hosts; a host's own list confirms it. Clients show the claim only when both agree.",
      "flow.authorship.show": "The show's kind 10154 names Alice as host.",
      "flow.authorship.authored": "Alice's kind 10164 lists the show's pubkey, confirming it.",
      "event.show.label": "Podcast metadata",
      "event.show.explain": "Kind 10154, replaceable, signed by the podcast key: the show itself.",
      "content.empty": "Empty: everything is in the tags.",
      "tag.title": "Title.",
      "tag.title.value": "The title text.",
      "tag.image": "Cover image.",
      "tag.image.url": "Image URL.",
      "tag.description": "Short description.",
      "tag.description.value": "The description text.",
      "tag.website": "A website of the show. Repeatable.",
      "tag.website.url": "Website URL.",
      "tag.p": "A person involved in the show. Confirmed only by their own kind 10164.",
      "tag.p.pubkey": "Their pubkey.",
      "tag.p.role": "Optional role: host, cohost or editor.",
      "role.host": "Runs the show.",
      "role.cohost": "Regular co-host.",
      "role.editor": "Edits the episodes.",
      "example.relay-hour": "The Relay Hour",
      "example.relay-hour.explain":
        "Signed by the show's key (grace's demo key), with Alice and Bob as hosts.",
      "event.authored.label": "Authored podcasts",
      "event.authored.explain": "Kind 10164, signed by a person: the podcasts they really author.",
      "tag.authored-p": "A podcast you author.",
      "tag.authored-p.pubkey": "The podcast's pubkey.",
      "example.alice-hosts": "Alice confirms",
      "example.alice-hosts.explain":
        "Alice lists The Relay Hour's pubkey, matching the show's claim.",
      "event.episode.label": "Episode",
      "event.episode.explain": "Kind 54, signed by the podcast key: one episode.",
      "content.notes": "Show notes in Markdown.",
      "tag.audio": "An audio file of the episode. Repeat for other formats.",
      "tag.audio.url": "Direct URL of the audio file.",
      "tag.audio.type": "Optional MIME type, such as audio/mpeg.",
      "example.episode-1": "Episode 1",
      "example.episode-1.explain":
        "Two audio formats so players can choose, and Markdown show notes.",
    },
  },
} satisfies NipStringsRange;
