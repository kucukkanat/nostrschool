// Owner: spec author r3 (NIPs 40–59). Adding a key? Also add it to ../../es/nips/r3.ts
// (English text + `// TODO(es)`). `text` holds every TextKey the NIP's spec references.
// Plain text only (no markdown): the editor and explain panel render these strings verbatim.
import type { NipStringsRange } from "../../../nips.ts";

export const r3 = {
  n40: {
    title: "Expiration Timestamp",
    summary:
      "Adds an expiration tag so an event can say when it stops being relevant. Supporting relays stop serving it after that moment and clients hide it, which suits temporary announcements and time-limited offers.",
    text: {
      "event.label": "Event with an expiration",
      "event.explain":
        "Any event kind can carry an expiration tag. Nothing else about the event changes: same content, same signature rules.",
      content:
        "Whatever the event kind normally holds. NIP-40 only adds the tag; the content is unaffected.",
      "tag.expiration":
        "Marks the moment after which relays and clients should treat the event as expired. Only one per event.",
      "tag.expiration.timestamp":
        "Unix time in seconds, written as a string, in the same format as created_at. After this moment relays should stop serving the event.",
      "example.announcement": "Maintenance notice that expires tomorrow",
      "example.announcement.explain":
        "Dave announces downtime for his relay. Once the window has passed the notice is useless, so it expires one day after it was posted.",
      "example.offer": "Week-long offer",
      "example.offer.explain":
        "Carol sells film rolls for a week. Other tags (here a hashtag) sit next to expiration as usual.",
      "how.add-tag.title": "Add the expiration tag",
      "how.add-tag.body":
        'The author picks a future Unix timestamp and adds ["expiration", "<timestamp>"] before signing. The tag is covered by the signature, so nobody can move the date later.',
      "how.check-relay.title": "Only send it to relays that understand it",
      "how.check-relay.body":
        "Clients should read a relay's NIP-11 document and only send expiring events to relays that list 40 in supported_nips. Other relays would keep the event forever.",
      "how.relay-behaviour.title": "Relays stop serving it",
      "how.relay-behaviour.body":
        "After the timestamp, a supporting relay should not return the event in query results and should reject it if someone publishes it again. It may delete it right away or later; deletion is not guaranteed.",
      "how.client-behaviour.title": "Clients ignore expired events",
      "how.client-behaviour.body":
        "A client that receives an event whose expiration is in the past (from a relay that does not support NIP-40, say) should hide it.",
      "how.not-private.title": "Expiration is not a privacy feature",
      "how.not-private.body":
        "The event is public until it expires, and anyone may have saved a copy. Never rely on expiration to make a message disappear for good.",
      "related.01": "Adds an optional tag to the basic event format.",
      "related.11":
        "Clients check supported_nips in the relay information document before using expiring events.",
      "related.09":
        "Deletion requests remove an event on demand; expiration schedules its removal in advance.",
    },
  },
  n42: {
    title: "Authentication of clients to relays",
    summary:
      'Lets a relay ask "who are you?" before serving or accepting events. The relay sends a challenge, the client signs a short-lived kind 22242 event that echoes it, and the relay then knows which pubkey is on the other end of the connection.',
    text: {
      "msg.challenge.label": "AUTH challenge (relay → client)",
      "msg.challenge.explain":
        "The relay offers a challenge string. It stays valid for the whole connection, or until the relay sends a new one.",
      "msg.challenge.challenge":
        "A random string chosen by the relay. The client copies it into the challenge tag of its auth event, which proves the signature was made for this connection.",
      "msg.auth.label": "AUTH event (client → relay)",
      "msg.auth.explain":
        "The client answers with a signed kind 22242 event. It may send several, one per pubkey it wants to authenticate.",
      "msg.auth.event":
        "The signed authentication event. Relays never broadcast or store it like a normal event.",
      "msg.ok.label": "OK (relay → client)",
      "msg.ok.explain":
        "The relay answers every AUTH event with OK, just as it does for EVENT. NIP-42 adds two machine-readable prefixes to the message.",
      "msg.ok.event-id":
        "Id of the event being acknowledged (the auth event, or a note the client tried to publish).",
      "msg.ok.accepted":
        "true when the relay accepted the event or authentication, false when it refused.",
      "msg.ok.message":
        'Human-readable reason. "auth-required: " means authenticate first; "restricted: " means you did authenticate, but this pubkey is still not allowed.',
      "msg.closed.label": "CLOSED (relay → client)",
      "msg.closed.explain":
        "When a subscription needs authentication, the relay ends it with CLOSED and an auth-required or restricted prefix.",
      "msg.closed.subscription-id": "The id of the REQ that was refused.",
      "msg.closed.message":
        'Starts with "auth-required: " (not authenticated yet) or "restricted: " (authenticated, still not allowed).',
      "example.challenge": "Relay sends a challenge",
      "example.auth-message": "Alice's signed answer",
      "example.auth-message.explain":
        "The kind 22242 event wrapped in an AUTH message. Its relay and challenge tags match what the relay sent.",
      "example.ok-accepted": "Relay accepts the authentication",
      "example.ok-auth-required": "Write refused until the client authenticates",
      "example.ok-auth-required.explain":
        "Alice tried to publish a note to a members-only relay before authenticating. After AUTH she can send the same EVENT again.",
      "example.ok-restricted": "Authenticated, but not allowed",
      "example.closed": "DM query refused",
      "example.closed.explain":
        "A relay that only serves direct messages to their participants closes the REQ until the client proves who it is.",
      "event.label": "Authentication event (kind 22242)",
      "event.explain":
        "An ephemeral event that is never published or queried. It only exists to be signed and sent inside an AUTH message.",
      "event.content": "Empty. Everything the relay needs is in the tags.",
      "tag.relay":
        "The relay this authentication is for. Stops a signed event from being replayed on a different relay.",
      "tag.relay.url":
        "The relay's URL. Relays may normalise it; checking the domain name is usually enough.",
      "tag.challenge": "The challenge string exactly as the relay sent it.",
      "tag.challenge.value": "Copied from the relay's AUTH message.",
      "example.event": "Alice authenticates to a paid relay",
      "example.event.explain":
        "Sign this to see the full event. Its created_at must be close to the current time (within about ten minutes) or the relay rejects it.",
      "flow.read.label": "Reading DMs from a relay that requires auth",
      "flow.read.explain": "The common sequence when a query needs authentication.",
      "flow.read.challenge":
        "The relay sends its challenge, on connect or just before refusing something.",
      "flow.read.closed": "The client's REQ for DMs is closed with auth-required.",
      "flow.read.sign": "The client signs a kind 22242 event with the relay URL and the challenge.",
      "flow.read.send": "It sends that event in an AUTH message.",
      "flow.read.ok":
        "The relay replies OK true; the client sends the REQ again and now receives events.",
      "how.challenge.title": "The relay issues a challenge",
      "how.challenge.body":
        'At any moment, usually right after connecting, the relay sends ["AUTH", "<challenge>"]. The client stores it for that connection.',
      "how.refusal.title": "A request is refused",
      "how.refusal.body":
        'When a REQ or EVENT needs a known identity, the relay answers CLOSED or OK false with an "auth-required: " prefix. That is the client\'s cue to authenticate.',
      "how.sign.title": "The client signs a kind 22242 event",
      "how.sign.body":
        "The event carries a relay tag and a challenge tag and is signed by the user's key. Because both values are inside the signature, the event only works for this relay and this connection.",
      "how.send.title": "The client sends it in an AUTH message",
      "how.send.body":
        '["AUTH", <signed event>]. A client may authenticate several pubkeys on one connection by sending several AUTH messages.',
      "how.verify.title": "The relay verifies and answers OK",
      "how.verify.body":
        "The relay checks the kind, that created_at is recent, that the challenge matches and that the relay URL is its own. Then it replies OK true and treats the connection as that pubkey until it closes.",
      "related.01":
        "Adds a new AUTH message to the basic client–relay protocol and reuses OK and CLOSED.",
      "related.11": "Relays can advertise auth requirements in their information document.",
      "related.17": "Relays that store private DMs typically require AUTH before serving them.",
      "related.59":
        "Relays may require AUTH before accepting or serving gift wraps, to fight spam and protect recipients.",
      "related.67":
        'The "auth" hint in EOSE tells a client that more results are available after authenticating.',
    },
  },
  n43: {
    title: "Relay Access Metadata and Requests",
    summary:
      "Gives membership relays a shared vocabulary: the relay publishes who its members are and what roles exist, users ask to join with an invite code or ask to leave, and the relay announces each change as a signed event.",
    text: {
      "tag.protected":
        'The NIP-70 protected tag ["-"]. Only the author may publish the event to a relay, so nobody can copy membership data elsewhere.',
      "tag.p": "The member being added or removed.",
      "tag.p.pubkey": "The member's public key, hex.",
      "tag.claim": "The invite code the user is redeeming.",
      "tag.claim.code":
        "An opaque code handed out by the relay (for example through the NIP-86 createclaim method or a kind 28935 invite).",
      "content.empty": "Empty. Everything is expressed in tags.",
      "members.label": "Membership list (kind 13534)",
      "members.explain":
        "A replaceable list of pubkeys with access to the relay, signed by the key in the self field of the relay's NIP-11 document. It is a hint, not the final word: clients should also check the member's own kind 10010 event.",
      "tag.member": "One member of the relay. Repeat the tag for each member.",
      "tag.member.pubkey": "The member's public key, hex.",
      "tag.member.role":
        "Optional role ids (the d tag of a kind 33534 role) assigned to this member.",
      "example.members": "Members of relay.delta.example",
      "example.members.explain":
        "Dave's key stands in for the relay's self key. Bob is a plain member, Erin also holds the role 28b7e50f.",
      "role.label": "Role definition (kind 33534)",
      "role.explain":
        "Defines a role that the relay can assign to members. How a relay treats each role is up to the relay; this event only describes it.",
      "tag.d": "Identifies the role. Member tags refer to this value.",
      "tag.d.value": "A short unique id, such as a random hex string.",
      "tag.label": "Display name of the role.",
      "tag.label.value": 'For example "moderator" or "supporter".',
      "tag.description": "What the role means.",
      "tag.description.value": "Free text shown to users.",
      "tag.color": "A colour for the role badge.",
      "tag.color.hue": "A hue from 0 to 360.",
      "tag.order": "Sorting position, for display only.",
      "tag.order.value": "An integer; lower numbers are shown first.",
      "example.role": "A moderator role",
      "example.role.explain":
        "The role id 28b7e50f is the same one the membership list assigns to Erin.",
      "add.label": "Member added (kind 8000)",
      "add.explain": "Optional announcement the relay publishes when it adds a member.",
      "example.add": "Grace becomes a member",
      "remove.label": "Member removed (kind 8001)",
      "remove.explain": "Optional announcement the relay publishes when it removes a member.",
      "example.remove": "Bob's access is revoked",
      "join.label": "Join request (kind 28934)",
      "join.explain":
        "Sent by a user to the relay to redeem an invite code. created_at must be within a few minutes of now. The relay answers with an OK message.",
      "example.join": "Grace redeems an invite",
      "example.join.explain":
        'The relay replies OK true (perhaps with "info: welcome") or OK false with a "restricted: " reason such as an expired code.',
      "invite.label": "Invite (kind 28935)",
      "invite.explain":
        "Inferred shape: the current NIP-43 text only says clients may request kind 28935 events from relays that list NIP-43 in supported_nips, without defining the event. Earlier drafts described it as an ephemeral, relay-generated event carrying a fresh claim code, which is what this example shows.",
      "example.invite": "Relay hands out a claim code",
      "leave.label": "Leave request (kind 28936)",
      "leave.explain":
        "Sent by a member who wants their access revoked. created_at must be within a few minutes of now.",
      "example.leave": "Bob leaves the relay",
      "flow.join.label": "Joining a membership relay",
      "flow.join.explain": "From invite code to appearing on the member list.",
      "flow.join.invite": "The user obtains a claim code, for example from a kind 28935 invite.",
      "flow.join.request": "The user's client sends a kind 28934 join request with that code.",
      "flow.join.add": "The relay accepts it and may announce the new member with kind 8000.",
      "flow.join.list": "The relay updates its kind 13534 membership list.",
      "how.self.title": "The relay has its own key",
      "how.self.body":
        "Every relay-side event here is signed by the pubkey in the self field of the relay's NIP-11 document, so clients can check it really came from the relay.",
      "how.list.title": "The relay publishes its members",
      "how.list.body":
        "A kind 13534 list names each member with a member tag, optionally followed by role ids. Roles themselves are kind 33534 events.",
      "how.both.title": "Membership is two-sided",
      "how.both.body":
        "The relay's kind 13534 list is only a hint. To decide whether someone is a member, a client should check both that list and the member's own kind 10010 event, published by the member.",
      "how.claim.title": "A user asks to join",
      "how.claim.body":
        "With an invite code in hand, the user sends a kind 28934 event with a claim tag. Its timestamp must be fresh, so an old request cannot be replayed.",
      "how.answer.title": "The relay answers and updates the list",
      "how.answer.body":
        'The relay replies OK true or OK false with "restricted: <reason>", updates the membership list and may publish a kind 8000 announcement.',
      "how.leave.title": "Leaving works the same way",
      "how.leave.body":
        "A member sends kind 28936. The relay removes them, updates the list and may publish kind 8001.",
      "related.11":
        "Relay events are signed by the self pubkey from the relay information document, and support is advertised in supported_nips.",
      "related.70": 'Every event here carries the protected "-" tag.',
      "related.42": 'Failed claims reuse the "restricted: " prefix from NIP-42.',
      "related.86": "The relay management API's createclaim method hands out invite codes.",
    },
  },
  n44: {
    title: "Encrypted Payloads (Versioned)",
    summary:
      "The encryption format Nostr uses today: two keys agree on a shared secret, the text is padded to hide its length, encrypted with ChaCha20, authenticated with HMAC-SHA256 and packed into one base64 string with a version byte. It defines no event kind; other NIPs put the result in an event's content.",
    text: {
      "encoding.label": "NIP-44 v2 payload",
      "encoding.explain":
        "Turns a plaintext into the base64 string that goes into an event's content. Only the sender and the recipient can decrypt it. In this editor the sender's secret key is a persona's demo key.",
      "input.sender":
        "Who encrypts. Their secret key (a demo key here) is combined with the recipient's public key.",
      "input.recipient":
        "Who can decrypt. Encrypting to your own pubkey works too and is how private list items are stored.",
      "input.plaintext":
        "The text to encrypt: 1 to 65,535 bytes of UTF-8. JSON is common (DM rumors, RPC requests, list items).",
      "input.nonce":
        "32 random bytes, fresh for every message. Leave it empty to get a random one; a fixed nonce is only for reproducible examples and must never be reused in real life.",
      output:
        "base64( version 0x02 | nonce 32 bytes | ciphertext | mac 32 bytes ). The ciphertext is at least 34 bytes because of padding, so a payload is at least 132 base64 characters.",
      "example.party": "Alice writes to Bob",
      "example.party.explain":
        "Encrypt a short message. Run it twice: the random nonce makes every payload different.",
      "example.fixed-nonce": "Bob replies, with a fixed nonce",
      "example.fixed-nonce.explain":
        "With the nonce pinned the output is reproducible, handy for comparing implementations. Real clients always use a random nonce.",
      "example.self": "Encrypting to yourself",
      "example.self.explain":
        "Sender and recipient are both Alice. This is how NIP-51 lists keep private items in the content field.",
      "how.conversation-key.title": "Agree on a conversation key",
      "how.conversation-key.body":
        "ECDH of the sender's secret key and the recipient's public key gives a shared x coordinate; HKDF-extract with the salt \"nip44-v2\" turns it into the conversation key. It is the same in both directions, so either side can decrypt.",
      "how.message-keys.title": "Derive per-message keys",
      "how.message-keys.body":
        "A fresh 32-byte nonce goes through HKDF-expand with the conversation key, producing 76 bytes: a ChaCha20 key, a ChaCha20 nonce and an HMAC key. A new nonce means new keys for every message.",
      "how.padding.title": "Pad the plaintext",
      "how.padding.body":
        "The text gets a 2-byte length prefix and is padded with zeros to the next size in a power-of-two scheme (at least 32 bytes). Similar-length messages then look identical in size.",
      "how.encrypt-mac.title": "Encrypt, then authenticate",
      "how.encrypt-mac.body":
        "ChaCha20 encrypts the padded bytes. HMAC-SHA256 over nonce + ciphertext produces the MAC, which the recipient checks in constant time before decrypting anything.",
      "how.encode.title": "Pack it into base64",
      "how.encode.body":
        "Version byte 0x02, nonce, ciphertext and MAC are concatenated and base64-encoded. The result goes into an event's content, and the event's signature then covers it.",
      "how.limits.title": "Know what it does not protect",
      "how.limits.body":
        "No forward secrecy, no deniability and no hiding of who talks to whom: the event's pubkey, tags and created_at stay public. NIP-59 gift wraps add metadata protection on top.",
      "related.04":
        "Replaces the old NIP-04 encryption (AES-CBC, no MAC, no padding), but is not a drop-in replacement for its DM kind.",
      "related.01":
        "A payload must always travel inside a signed event, whose signature authenticates it.",
      "related.17": "Private direct messages encrypt their seals and gift wraps with NIP-44.",
      "related.46": "Remote signing requests and responses are NIP-44 payloads.",
      "related.51": "Private list items are a NIP-44 payload the author encrypts to themselves.",
      "related.59": "Seals and gift wraps carry NIP-44 payloads.",
    },
  },
  n45: {
    title: "Counting results",
    summary:
      'Adds a COUNT verb so a client can ask a relay "how many events match?" instead of downloading them all. Relays may return an approximate number and a HyperLogLog sketch that clients can merge across relays.',
    text: {
      "msg.query-id": "An id the client chooses for this query; the relay echoes it in its answer.",
      "msg.request.label": "COUNT request (client → relay)",
      "msg.request.explain":
        "Same shape as a REQ: a query id plus one or more NIP-01 filters. Matches of all filters are added up into a single number.",
      "msg.request.filter": "A normal REQ filter. Several filters are OR'd together.",
      "msg.response.label": "COUNT response (relay → client)",
      "msg.response.explain":
        "The relay's answer, sent once. Unlike REQ there is no stream of events and no EOSE.",
      "msg.response.result": "An object with the count and, optionally, approximate and hll.",
      "msg.response.count": "How many events match.",
      "msg.response.approximate": "true when the relay used a probabilistic count to save work.",
      "msg.response.hll":
        "Optional HyperLogLog sketch: 256 one-byte registers as 512 hex characters. Clients can merge sketches from several relays.",
      "msg.closed.label": "CLOSED (relay → client)",
      "msg.closed.explain":
        "A relay that will not answer a COUNT must reply with CLOSED and a reason.",
      "msg.closed.message":
        'Why the count was refused, with a machine-readable prefix such as "auth-required: ".',
      "example.notes": "Count Alice's notes and reactions",
      "example.followers": "Count Alice's followers",
      "example.followers.explain":
        "A follower count is the number of kind 3 follow lists that p-tag her. One of the canonical queries that relays may precompute.",
      "example.reactions": "Count reactions to Erin's ostrich note",
      "example.exact": "Exact answer",
      "example.approximate": "Approximate answer",
      "example.hll": "Answer with a HyperLogLog sketch",
      "example.hll.explain":
        "The hll value lets the client combine this relay's answer with others without double counting.",
      "example.refused": "Relay refuses to count DMs",
      "flow.followers.label": "Showing a follower count",
      "flow.followers.explain": "One round trip instead of downloading thousands of follow lists.",
      "flow.followers.ask": "The client sends COUNT with a kind 3 filter p-tagging the profile.",
      "flow.followers.answer": "The relay replies with the count, possibly with an hll sketch.",
      "how.ask.title": "Ask with a filter",
      "how.ask.body":
        '["COUNT", <query id>, <filters>...] uses exactly the same filters as REQ. Counting follow lists that tag a pubkey gives a follower count without fetching them.',
      "how.answer.title": "Get one number back",
      "how.answer.body":
        'The relay answers ["COUNT", <query id>, {"count": n}] and may add "approximate": true if it estimated the result.',
      "how.refuse.title": "Or a refusal",
      "how.refuse.body":
        "If the relay will not count, for example private DMs of someone else, it replies CLOSED with a reason.",
      "how.hll.title": "HyperLogLog for merging",
      "how.hll.body":
        "For filters with one tag value the relay can also return 256 registers. Each counted event's pubkey picks a register (byte at a deterministic offset derived from the filter) and stores the longest run of leading zero bits seen.",
      "how.merge.title": "Combine relays without double counting",
      "how.merge.body":
        "The client takes the highest value of each register across relays, adds events it fetched itself, and estimates the total from the merged sketch. The same follower seen on three relays is counted once.",
      "related.01": "Adds COUNT next to REQ and reuses NIP-01 filters and CLOSED.",
      "related.11": "Relays list 45 in supported_nips when they answer COUNT.",
      "related.42": "Relays may require authentication before counting restricted events.",
    },
  },
  n46: {
    title: "Nostr Remote Signing",
    summary:
      'Keeps your secret key in one place, a "bunker", and lets apps ask it to sign. The app and the bunker talk through encrypted kind 24133 events on relays, using JSON-RPC-style requests such as sign_event, get_public_key and nip44_encrypt.',
    text: {
      "request.label": "Request (kind 24133, client → remote signer)",
      "request.explain":
        "Signed by the client's disposable keypair and p-tagged to the remote signer. Relays only see two unknown pubkeys exchanging ciphertext.",
      "request.content": "A NIP-44 payload encrypted from the client key to the remote-signer key.",
      "request.plaintext": "A JSON-RPC-like object: id, method and a list of string parameters.",
      "request.id": "A random string. The response carries the same id so the client can match it.",
      "request.method": "The command for the remote signer.",
      "request.params":
        "Positional string parameters. Objects such as an event template are passed JSON-stringified.",
      "method.connect":
        'Opens the session. Params: remote-signer pubkey, optional secret, optional requested permissions ("nip44_encrypt,sign_event:1"), optional client metadata JSON. Result: "ack" or the secret.',
      "method.sign_event":
        "Params: one JSON-stringified template {kind, content, tags, created_at}. Result: the signed event, JSON-stringified.",
      "method.ping": 'No params. Result: "pong". Checks the signer is alive.',
      "method.get_public_key":
        "No params. Result: the user pubkey, which may differ from the remote-signer pubkey. Call it after connect.",
      "method.nip04_encrypt":
        "Params: third-party pubkey, plaintext. Result: a legacy NIP-04 ciphertext.",
      "method.nip04_decrypt":
        "Params: third-party pubkey, NIP-04 ciphertext. Result: the plaintext.",
      "method.nip44_encrypt": "Params: third-party pubkey, plaintext. Result: a NIP-44 ciphertext.",
      "method.nip44_decrypt":
        "Params: third-party pubkey, NIP-44 ciphertext. Result: the plaintext.",
      "method.switch_relays":
        "No params. Result: the signer's current relay list, or null if nothing changes.",
      "method.logout": 'No params. Result: "ack". The signer forgets this client\'s session.',
      "request.tag.p": "Routes the request to the remote signer.",
      "request.tag.p.pubkey":
        "The remote-signer pubkey from the bunker:// URL or from the connect response's author.",
      "response.label": "Response (kind 24133, remote signer → client)",
      "response.explain": "Signed by the remote-signer key and p-tagged to the client key.",
      "response.content":
        "A NIP-44 payload encrypted from the remote-signer key to the client key.",
      "response.plaintext":
        "The answer: the request's id, a result string and, on failure, an error string.",
      "response.id": "Copied from the request.",
      "response.result":
        "The result as a string (JSON-stringified when it is an object, like a signed event).",
      "response.error":
        'Present only when something went wrong. With result "auth_url" it holds a URL the user must open.',
      "response.tag.p": "Routes the response back to the client.",
      "response.tag.p.pubkey": "The client pubkey that sent the request.",
      "example.sign-request": "Client asks to sign a note",
      "example.sign-request.explain":
        "Decrypt the content to see the sign_event request. Carol's demo key stands in for the client's throwaway key; Alice's bunker answers.",
      "example.connect": "Client connects with a secret",
      "example.connect.explain":
        "The connect request from a bunker:// token: signer pubkey, the one-time secret and the permissions the app wants.",
      "example.signed": "Signer returns the signed event",
      "example.signed.explain":
        "The result is the complete signed kind 1 event as a JSON string. The client can publish it as is.",
      "example.ack": "Signer accepts the connection",
      "example.auth-url": "Signer needs the user to approve in a browser",
      "example.auth-url.explain":
        'result "auth_url" with the URL in error. The client opens it and keeps listening; the real response arrives with the same id once the user approves.',
      "discovery.label": "Signer discovery (nostr.json)",
      "discovery.explain":
        'A remote signer may publish its app pubkey, relays and a connect URL template through NIP-05 under the name "_".',
      "discovery.names": "Standard NIP-05 names map.",
      "discovery.names._":
        "The remote signer's app pubkey. Clients use it to verify the signer's NIP-89 announcement.",
      "discovery.nip46": "Connection hints for NIP-46.",
      "discovery.relays":
        "Relays the signer listens on; use them when building a nostrconnect:// string.",
      "discovery.nostrconnect-url":
        "A URL with a <nostrconnect> placeholder. Replace it with a nostrconnect:// string to send the user to the signer's approval page.",
      "example.discovery": "Discovery file of a bunker",
      "flow.sign.label": "Signing a note with a remote signer",
      "flow.sign.explain": "From finding the signer to getting a signed event back.",
      "flow.sign.discover": "Optional: the client finds the signer's relays via nostr.json.",
      "flow.sign.request": "The client sends an encrypted sign_event request.",
      "flow.sign.response":
        "The signer answers with the signed event, encrypted back to the client.",
      "how.keys.title": "Three keys, three roles",
      "how.keys.body":
        "The client makes a throwaway client keypair. The remote signer has its own key for talking, and holds the user key that actually signs. Signer key and user key may be the same, but clients must not assume it.",
      "how.connect.title": "Connect",
      "how.connect.body":
        "Either the signer hands out bunker://<signer-pubkey>?relay=…&secret=…, and the client sends a connect request; or the client shows nostrconnect://<client-pubkey>?relay=…&secret=…, and the signer replies with the secret. Then the client calls get_public_key.",
      "how.request.title": "Send an encrypted request",
      "how.request.body":
        "Every call is a kind 24133 event from the client key, p-tagged to the signer, with a NIP-44-encrypted {id, method, params} object in the content.",
      "how.response.title": "Get an encrypted response",
      "how.response.body":
        "The signer replies with kind 24133, p-tagged to the client, containing {id, result} or {id, result, error}. Unknown methods must get an error.",
      "how.auth-challenge.title": "Sometimes the user must approve elsewhere",
      "how.auth-challenge.body":
        'A response with result "auth_url" tells the client to open the URL in error. After the user approves there, the signer sends the real response with the same id.',
      "how.relays-logout.title": "Relays and logout",
      "how.relays-logout.body":
        "The signer stays in charge of relays: clients call switch_relays after connecting and move when told. On logout the client may send logout, and must delete its client keypair either way.",
      "related.44": "All requests and responses are NIP-44 encrypted.",
      "related.05": "Signers may announce relays and a connect URL in nostr.json.",
      "related.89": "Signers may announce themselves as kind 31990 apps handling kind 24133.",
      "related.07": "Browser extensions are the in-browser alternative to a remote signer.",
      "related.55": "Android signer apps are the on-device alternative.",
    },
  },
  n47: {
    title: "Nostr Wallet Connect",
    summary:
      "Lets an app pay and create Lightning invoices through your wallet without holding your funds. The wallet gives the app a connection URI; the app then sends encrypted requests such as pay_invoice over relays and gets encrypted results back.",
    text: {
      "info.label": "Wallet info (kind 13194)",
      "info.explain":
        "A replaceable event the wallet service publishes on its relays, listing what this connection can do. Clients read it first.",
      "info.content":
        'The supported methods, separated by spaces, for example "pay_invoice get_balance".',
      "info.tag.encryption":
        "Encryption schemes the wallet accepts. Without this tag clients must assume legacy NIP-04 only.",
      "info.tag.encryption.schemes":
        'Space-separated: "nip44_v2" (preferred) and/or "nip04" (deprecated).',
      "info.tag.extensions": "Optional NWC extension specs the wallet supports.",
      "info.tag.extensions.ids":
        'Space-separated extension ids from the NWC repository, such as "02 03 04".',
      "example.info": "Dave's wallet service advertises itself",
      "example.info.explain":
        "Dave's demo key stands in for the wallet service key from the connection URI.",
      "request.label": "Request (kind 23194, client → wallet)",
      "request.explain":
        "Signed with the secret from the connection URI (not the user's identity key), p-tagged to the wallet service.",
      "request.content":
        "A NIP-44 payload (or legacy NIP-04, if that is what the encryption tag says) holding the command.",
      "request.plaintext": '{"method": ..., "params": {...}}.',
      "request.method": "The command to run.",
      "request.params": "Command-specific parameters. Amounts are always in millisatoshis.",
      "method.pay_invoice":
        "Pay a BOLT11 invoice. Params: invoice, optional amount and metadata. Result: preimage and fees_paid.",
      "method.make_invoice":
        "Create an invoice. Params: amount, optional description, description_hash, expiry, metadata.",
      "method.lookup_invoice": "Find an invoice or payment by payment_hash or invoice.",
      "method.get_balance": "No params. Result: balance in millisatoshis.",
      "method.get_info":
        "No params. Result: node alias, pubkey, network, block height, supported methods and extensions.",
      "param.invoice": "A BOLT11 invoice string (lnbc...).",
      "param.amount": "Amount in millisatoshis.",
      "param.description": "Text description to embed in a new invoice.",
      "param.description-hash":
        "Hash of a description, used instead of the description itself (zaps use this).",
      "param.expiry": "Seconds until a new invoice expires.",
      "param.payment-hash": "Hash identifying the invoice to look up.",
      "param.metadata": "Free-form extra data such as zap or boostagram details.",
      "request.tag.p": "Routes the request to the wallet service.",
      "request.tag.p.pubkey": "The wallet service pubkey from the connection URI.",
      "request.tag.encryption":
        "Which scheme encrypted this request. Must be one the wallet listed. Missing means NIP-04.",
      "request.tag.encryption.scheme": "The encryption used for this request's content.",
      "scheme.nip44": "NIP-44 v2. Required for new implementations.",
      "scheme.nip04": "Legacy NIP-04, kept only for backwards compatibility.",
      "request.tag.expiration":
        "Optional deadline: a wallet receiving the request after this time ignores it.",
      "request.tag.expiration.timestamp": "Unix seconds.",
      "example.pay": "Pay an invoice",
      "example.pay.explain":
        "Decrypt the content to read the pay_invoice command. Bob's demo key stands in for the connection secret.",
      "example.balance": "Check the balance, valid for one minute",
      "response.label": "Response (kind 23195, wallet → client)",
      "response.explain":
        "Signed by the wallet service, p-tagged to the client key and e-tagged to the request it answers.",
      "response.content": "Encrypted with the scheme the request used.",
      "response.plaintext": '{"result_type": ..., "error": ..., "result": ...}.',
      "response.result-type": "The method this answers.",
      "response.error": "null on success, otherwise an object with code and message.",
      "response.error.code": "Machine-readable error code.",
      "response.error.message": "Human-readable explanation.",
      "error.RATE_LIMITED": "Too many requests; retry in a few seconds.",
      "error.NOT_IMPLEMENTED": "The wallet does not know or support this method.",
      "error.INSUFFICIENT_BALANCE": "Not enough funds for the amount plus the fee reserve.",
      "error.QUOTA_EXCEEDED": "The connection's spending budget is used up.",
      "error.RESTRICTED": "This key may not perform this operation.",
      "error.UNAUTHORIZED": "No wallet is connected to this key.",
      "error.INTERNAL": "Something broke inside the wallet service.",
      "error.UNSUPPORTED_ENCRYPTION":
        "The request used an encryption scheme the wallet does not support.",
      "error.OTHER": "Any other error.",
      "error.PAYMENT_FAILED": "pay_invoice only: the payment failed (no route, timeout, capacity).",
      "error.NOT_FOUND": "lookup_invoice only: no matching invoice.",
      "response.result": "null on error, otherwise the method's result object.",
      "result.preimage": "Proof the invoice was paid (pay_invoice).",
      "result.fees-paid": "Routing fees paid, in millisatoshis.",
      "result.balance": "Wallet balance in millisatoshis (get_balance).",
      "response.tag.p": "Routes the response to the client.",
      "response.tag.p.pubkey": "The client's pubkey, derived from the connection secret.",
      "response.tag.e": "The request this response answers.",
      "response.tag.e.id": "Event id of the kind 23194 request.",
      "example.paid": "Payment succeeded",
      "example.paid.explain":
        "The e tag points at the pay request above (as signed by Bob at the demo time).",
      "example.error": "Payment refused: insufficient balance",
      "example.error.explain": "error is filled in and result is null.",
      "flow.pay.label": "Paying an invoice through NWC",
      "flow.pay.explain":
        "What happens after the user pasted a nostr+walletconnect:// URI into the app.",
      "flow.pay.info": "The app reads the wallet's info event to learn its methods and encryption.",
      "flow.pay.request": "It sends an encrypted pay_invoice request.",
      "flow.pay.response": "The wallet pays and answers with the preimage, or with an error.",
      "how.uri.title": "Pair with a connection URI",
      "how.uri.body":
        "The wallet shows nostr+walletconnect://<wallet-pubkey>?relay=…&secret=…&lud16=…. The secret is a fresh key just for this app, so payments are not linked to the user's Nostr identity and each connection can be revoked or given a budget.",
      "how.info.title": "Read what the wallet supports",
      "how.info.body":
        "The app fetches the kind 13194 info event from the URI's relays: content lists the methods, the encryption tag the schemes.",
      "how.request.title": "Send an encrypted command",
      "how.request.body":
        "A kind 23194 event signed with the connection secret, p-tagged to the wallet, with the command NIP-44-encrypted in the content. Relays see only ciphertext.",
      "how.response.title": "Receive the result",
      "how.response.body":
        "The wallet answers with kind 23195, p-tagging the app and e-tagging the request. result_type names the method; either error or result is filled in.",
      "how.encryption.title": "Negotiate encryption",
      "how.encryption.body":
        "Clients choose nip44_v2 whenever the info event lists it and say so in each request's encryption tag. If the info event has no encryption tag, only NIP-04 is supported.",
      "related.44": "Requests and responses are NIP-44 encrypted.",
      "related.04": "The original, deprecated encryption, still negotiable for old wallets.",
      "related.40": "Requests may carry an expiration tag.",
      "related.57": "Apps often use NWC to pay the invoices behind zaps.",
    },
  },
  n48: {
    title: "Bridged Events",
    summary:
      "Marks events that were copied into Nostr by a bridge from ActivityPub, Bluesky, RSS or the web. A proxy tag points back to the original object, so clients can link to it and avoid showing the same post twice.",
    text: {
      "event.label": "Bridged event",
      "event.explain":
        "Any kind can carry a proxy tag. Its presence says the event did not originate on Nostr but somewhere else on the web.",
      content: "The bridged post's content, converted to the event kind's normal format.",
      "tag.proxy": "Links the event to its source object on another protocol.",
      "tag.proxy.id":
        "The source object's id, in that protocol's format: a URL for ActivityPub and the web, an at:// URI for AT Protocol, a feed URL plus #guid for RSS. It must be globally unique.",
      "tag.proxy.protocol": "Name of the source protocol.",
      "protocol.activitypub": "Mastodon and the rest of the fediverse. Id: the object's URL.",
      "protocol.atproto": "Bluesky's AT Protocol. Id: an at:// URI.",
      "protocol.rss":
        "RSS or Atom feeds. Id: the feed URL with the item's guid as a URL-encoded fragment.",
      "protocol.web": "Any web page. Id: its URL.",
      "example.activitypub": "A note bridged from the fediverse",
      "example.activitypub.explain":
        "Frank's demo key stands in for the bridge's key for this fediverse user. Clients can show a \"view original\" link.",
      "example.atproto": "A Bluesky post",
      "example.rss": "A blog post from an RSS feed",
      "example.rss.explain": "The fragment after # is the item's guid, URL-encoded.",
      "how.bridge.title": "A bridge copies a post",
      "how.bridge.body":
        "Bridges such as Mostr watch another network and republish its posts as Nostr events, usually under a key the bridge controls for each remote account.",
      "how.tag.title": "It records where the post came from",
      "how.tag.body":
        'The bridge adds ["proxy", <source id>, <protocol>]. The id is whatever uniquely names the object on its home network.',
      "how.protocol.title": "The protocol name says how to read the id",
      "how.protocol.body":
        "activitypub, atproto, rss and web are defined so far; the list may grow. Clients that do not know a protocol can still show the id as plain text.",
      "how.dedupe.title": "Clients deduplicate and link back",
      "how.dedupe.body":
        "If two bridges import the same object, the identical source id lets clients show it once. The id can also become a link to the original.",
      "related.01": "Adds an optional tag to any event; nothing else changes.",
    },
  },
  n49: {
    title: "Private Key Encryption (ncryptsec)",
    summary:
      "Defines ncryptsec, a password-protected form of a secret key. The password is stretched with scrypt, the key is encrypted with XChaCha20-Poly1305, and the result is a bech32 string starting with ncryptsec1 that is safe to back up but not to publish.",
    text: {
      "encoding.label": "ncryptsec (password-encrypted secret key)",
      "encoding.explain":
        "Encrypts a 32-byte secret key with a password. Decrypting needs the same password; the cost settings travel inside the string.",
      "input.secret-key":
        "The secret key as 64 hex characters. This example uses the NIP's published test key. Never type a real key into a website.",
      "input.password":
        "Normalised to Unicode NFKC first, so the same password typed on another device produces the same key.",
      "input.log-n":
        "scrypt cost as a power of two. 16 needs 64 MiB and about 0.1 s; 20 needs 1 GiB and about 2 s. Higher is slower to crack and slower to unlock.",
      "input.key-security":
        "One byte recording how carefully this key has been handled. It is authenticated but not secret.",
      "security.0":
        "0x00: the key is known to have been handled insecurely (stored or pasted unencrypted).",
      "security.1": "0x01: the key is not known to have been handled insecurely.",
      "security.2": "0x02: the client does not track this.",
      output:
        'bech32 "ncryptsec" over 91 bytes: version 0x02, log_n (1), salt (16), nonce (24), key-security byte (1), ciphertext + tag (48).',
      "example.test-vector": "The NIP's test vector settings",
      "example.test-vector.explain":
        'Password "nostr", log_n 16. The NIP\'s published ncryptsec decrypts to this key; encrypting again gives a different string because salt and nonce are random.',
      "example.stronger": "A stronger setting",
      "example.stronger.explain":
        "log_n 20 takes about a gigabyte of memory and a couple of seconds, which makes guessing passwords far more expensive.",
      "example.unicode": "Unicode password",
      "example.unicode.explain":
        '"ÅΩẛ̣" is normalised to NFKC (U+00C5 U+03A9 U+1E69) before scrypt, so differently composed input still unlocks the key.',
      "how.password.title": "Normalise the password",
      "how.password.body":
        "The password is converted to Unicode NFKC so it is byte-for-byte identical on every device and keyboard.",
      "how.scrypt.title": "Stretch it with scrypt",
      "how.scrypt.body":
        "scrypt(password, salt = 16 random bytes, N = 2^log_n, r = 8, p = 1) produces a 32-byte symmetric key. The slow, memory-hard step is what protects weak passwords. The key is used once and discarded.",
      "how.encrypt.title": "Encrypt the secret key",
      "how.encrypt.body":
        "XChaCha20-Poly1305 encrypts the 32 raw key bytes with a random 24-byte nonce. The key-security byte is the associated data: not hidden, but tampering with it breaks decryption.",
      "how.encode.title": "Pack and bech32-encode",
      "how.encode.body":
        "Version 0x02, log_n, salt, nonce, key-security byte and ciphertext are concatenated (91 bytes) and bech32-encoded with the prefix ncryptsec.",
      "how.keep-private.title": "Back it up, do not publish it",
      "how.keep-private.body":
        "An ncryptsec is much safer than a bare nsec, but publishing many of them would help attackers crack weak passwords in bulk. Keep it in backups or password managers.",
      "related.19": "Uses bech32 like NIP-19 entities, with its own ncryptsec prefix.",
      "related.06": "Another way to back up a key: a mnemonic phrase.",
      "related.46": "Remote signers avoid moving the key around at all.",
    },
  },
  n50: {
    title: "Search Capability",
    summary:
      'Adds a search field to REQ filters so clients can ask relays for full-text results, such as "best nostr apps". Relays rank results by relevance instead of date and may support extra key:value options like language:en.',
    text: {
      "msg.req.label": "REQ with a search filter",
      "msg.req.explain":
        "A normal subscription whose filter has a search string. Other filter fields (kinds, authors, limit…) narrow the results as usual.",
      "msg.req.subscription-id": "Any id the client picks for this subscription.",
      "msg.req.filter":
        "A NIP-01 filter plus search: a human-readable query. Several filters may be sent; each can have its own search.",
      "example.plain": "Plain text search",
      "example.plain.explain":
        'The 20 most relevant notes for "best nostr apps". limit applies after ranking, not by date.',
      "example.extensions": "Search with extensions",
      "example.extensions.explain":
        "language:en keeps only English results and nsfw:false hides NSFW events. Relays ignore extensions they do not support.",
      "example.several": "Two searches at once",
      "example.several.explain":
        "Filters are OR'd: anything about relays, plus long-form articles about protocols by users with a beta.example NIP-05.",
      "how.field.title": "Put the query in search",
      "how.field.body":
        "The search field holds free text. Relays match it against content and, where it makes sense for the kind, other fields too.",
      "how.ranking.title": "Results come by relevance",
      "how.ranking.body":
        "Relays should return events ordered by match quality, not by created_at, and apply limit after ranking.",
      "how.extensions.title": "Optional key:value extensions",
      "how.extensions.body":
        "include:spam turns off spam filtering, domain:<domain> keeps authors with a valid NIP-05 on that domain, language:<ISO 639-1 code>, sentiment:<negative|neutral|positive> and nsfw:<true|false> filter further. Unknown extensions are ignored.",
      "how.support.title": "Ask relays that support it",
      "how.support.body":
        "Clients check supported_nips for 50, or send the query anyway and drop results that do not match. Querying several search relays evens out differences between implementations.",
      "related.01": "Adds a field to the REQ filter.",
      "related.11": "Relays advertise search support in supported_nips.",
      "related.51": "Users list their preferred search relays in a kind 10007 list.",
      "related.05": "The domain: extension relies on NIP-05 identifiers.",
    },
  },
  n51: {
    title: "Lists",
    summary:
      "A family of list events: one-per-user standard lists (mutes, pins, bookmarks, search relays…) and named sets you can have many of (follow sets, curation sets, relay sets…). Items go in tags when public, or in encrypted content when private.",
    text: {
      "field.relay-hint": "Optional relay where the referenced item can be found.",
      "field.pubkey": "A public key, hex.",
      "field.petname": "Optional local nickname for this person.",
      "field.event-id": "Id of the referenced event.",
      "field.address":
        "Coordinate kind:pubkey:d-tag of an addressable event, such as an article or another set.",
      "field.hashtag": "A topic, without the #.",
      "field.relay-url": "A relay URL (ws:// or wss://).",
      "field.shortcode": "The :shortcode: used in text (letters, digits, underscore).",
      "field.emoji-url": "URL of the emoji image.",
      "field.word": "A lowercase word or phrase to hide.",
      "field.d": "Identifier of this set. Each set of the same kind needs its own.",
      "field.title": "Display name of the set.",
      "field.image": "Cover image URL.",
      "field.description": "What the set is about.",
      "field.group-id": "The NIP-29 group id on its relay.",
      "field.group-relay": "The relay that hosts the group.",
      "field.group-name": "Optional display name of the group.",
      "field.server": "A Blossom media server URL.",
      "field.feed-url": "An RSS/XML podcast feed URL.",
      "tag.p": "A person in the list.",
      "tag.e": "An event in the list (a note, a channel, a video…).",
      "tag.a": "An addressable event in the list (an article, a community, another set…).",
      "tag.t": "A hashtag in the list.",
      "tag.relay": "A relay in the list.",
      "tag.emoji": "A custom emoji (NIP-30).",
      "tag.word": "A word to mute.",
      "tag.group": "A NIP-29 group the user belongs to.",
      "tag.r": "A relay used for groups.",
      "tag.server": "A media server (Blossom, kind 10063).",
      "tag.url": "A podcast feed URL (kind 10054).",
      "tag.d":
        "Names this set. Sets are addressable: the same author, kind and d replace each other.",
      "tag.title": "Optional title shown in pickers and menus.",
      "tag.image": "Optional image for the set.",
      "tag.description": "Optional description of the set.",
      "content.private":
        'Private items: a NIP-44 payload the author encrypted to their own key. Only they can read it. (Old lists used NIP-04; a ciphertext containing "?iv=" is NIP-04.)',
      "content.private.plaintext": "Decrypts to a JSON array shaped exactly like the tags array.",
      "content.private.items":
        'Private items, for example [["word", "spoiler"], ["t", "politics"]].',
      "content.private.relays": 'Private relay entries: [["relay", "wss://…"]].',
      "content.optional-private":
        "Usually empty. It may hold private items encrypted with NIP-44 to the author's own key, shaped like the tags array.",
      "mute.label": "Mute list (kind 10000)",
      "mute.explain":
        "People, hashtags, words and threads the user does not want to see. One per user.",
      "example.mute": "Alice's mute list, public and private",
      "example.mute.explain":
        'Muting Frank and the word "giveaway" is public. Decrypting the content (Alice\'s demo key) reveals two private mutes: the word "spoiler" and the hashtag politics.',
      "pinned.label": "Pinned notes (kind 10001)",
      "pinned.explain": "Notes the user wants to showcase on their profile.",
      "example.pinned": "Alice pins her relay thread",
      "bookmarks.label": "Bookmarks (kind 10003)",
      "bookmarks.explain": "One global list of saved notes (e) and articles (a).",
      "example.bookmarks": "Carol saves a note and an article",
      "relays.label": "Relay lists (kinds 10006, 10007, 10012, 10102)",
      "relays.explain":
        "10006 blocked relays (never connect), 10007 search relays, 10012 favourite relays to browse (may also point to relay sets), 10102 relays with good wiki articles.",
      "example.search-relays": "Alice's search relays",
      "example.search-relays.explain": "Clients send NIP-50 search queries to these relays.",
      "example.blocked-relays": "Bob blocks a spammy relay",
      "private-relays.label": "Private relays (kind 10013)",
      "private-relays.explain":
        "Relays for private content such as drafts (NIP-37). Always fully encrypted; no public tags.",
      "example.private-relays": "Alice's drafts relay",
      "example.private-relays.explain": "Decrypt with Alice's demo key to see the relay.",
      "people.label": "People lists (kinds 10017, 10020, 10101)",
      "people.explain":
        "10020 media follows (photo and video clients), 10017 git authors, 10101 trusted wiki authors.",
      "example.media-follows": "Alice follows Carol's photos",
      "example.media-follows.explain":
        "Same format as a follow list: pubkey, optional relay hint, optional petname.",
      "other.label": "Other standard lists",
      "other.explain":
        "10004 communities (a to kind 34550), 10005 public chats (e to kind 40), 10009 groups (group + r), 10015 interests (t, a to interest sets), 10018 git repositories (a to 30617), 10021 favourite follow sets, 10030 emojis (emoji, a to emoji sets), 10054 favourite podcasts (p, url), 10063 Blossom servers (server), 10064 authored podcasts (p).",
      "example.interests": "Erin's interests",
      "example.interests.explain": "Hashtags plus a pointer to one of her interest sets.",
      "example.groups": "Carol's groups",
      "example.emojis": "Erin's emoji list",
      "sets.label": "Sets (kinds 30000–30267, 39089, 39092)",
      "sets.explain":
        "Named, addressable lists: a user can have many, each with its own d tag. 30000 follow sets, 30002 relay sets, 30003 bookmark sets, 30004–30006 curation sets (articles, videos, pictures), 30007 kind mute sets (d = the kind), 30008 badge sets, 30015 interest sets, 30030 emoji sets, 30063 release artifacts, 30267 app curation, 39089/39092 starter packs.",
      "example.follow-set": 'Alice\'s "Relay operators" follow set',
      "example.follow-set.explain":
        "A client can offer this as a feed or as a starter pack to follow at once.",
      "example.curation-set": "A reading list of articles and a note",
      "example.relay-set": "Bob's relay set for fast publishing",
      "legacy.label": "Deprecated: kind 30001 lists",
      "legacy.explain":
        'Older clients stored pins, bookmarks and communities as kind 30001 with a fixed d tag (and mutes as kind 30000 with d "mute"). Use the standard lists instead.',
      "legacy.tag.d": "The old fixed list name. Deprecated: migrate to the standard list kind.",
      "legacy.pin": "Use kind 10001 pinned notes instead.",
      "legacy.bookmark": "Use kind 10003 bookmarks instead.",
      "legacy.communities": "Use kind 10004 communities instead.",
      "example.legacy": "Bob's old-style bookmarks",
      "example.legacy.explain":
        "The editor flags the deprecated form. Clients should move these items to kind 10003.",
      "how.public.title": "Public items live in tags",
      "how.public.body":
        'Each item is a tag: ["p", pubkey], ["e", id], ["a", coordinate], ["t", hashtag], ["relay", url]… Anyone can read them.',
      "how.private.title": "Private items hide in the content",
      "how.private.body":
        "The author takes a tags-shaped array of private items, JSON-encodes it, encrypts it with NIP-44 to their own key and stores it in content. The same list can mix both.",
      "how.standard-lists.title": "Standard lists: one per user",
      "how.standard-lists.body":
        "Kinds 10000–19999 are replaceable, so each user has exactly one mute list, one bookmark list and so on. Publishing a new version replaces the old one.",
      "how.sets.title": "Sets: as many as you like",
      "how.sets.body":
        "Kinds 30000+ are addressable, identified by kind, author and d tag. Sets may add title, image and description tags for nicer menus.",
      "how.append.title": "Append new items at the end",
      "how.append.body":
        "Clients add new items to the end so the list stays in chronological order, and must republish the whole list on every change.",
      "how.legacy.title": "Migrate old lists",
      "how.legacy.body":
        "Kind 30001 lists with d pin, bookmark or communities, and kind 30000 with d mute, are deprecated forms of the standard lists.",
      "related.01": "Lists are replaceable (10000s) or addressable (30000s) events.",
      "related.44": "Private items are encrypted with NIP-44 to the author's own key.",
      "related.04":
        'Older lists encrypted private items with NIP-04; clients can detect "?iv=" and decrypt accordingly.',
      "related.02": "The follow list (kind 3) is the original list.",
      "related.65": "The read/write relay list (kind 10002) is also a standard list.",
      "related.58": "Profile badges (10008) and badge sets (30008) are NIP-51 lists.",
      "related.29": "The groups list (10009) points at NIP-29 groups.",
      "related.30": "Emoji lists and sets use NIP-30 emoji tags.",
    },
  },
  n52: {
    title: "Calendar Events",
    summary:
      "Calendar entries as Nostr events: all-day events by date, timed events with time zones, calendars that group them, and RSVPs where people answer accepted, declined or tentative. Recurring events are deliberately left out.",
    text: {
      "tag.d":
        "Identifies this event, calendar or RSVP among the author's others of the same kind.",
      "field.d": "A short unique string chosen by the client.",
      "tag.title": "The title. Required.",
      "field.title": "Display title.",
      "tag.summary": "A short description for lists and previews.",
      "field.summary": "One line of text.",
      "tag.image": "An image for the event.",
      "field.image": "Image URL.",
      "tag.location": "Where it happens. Repeat for several locations.",
      "field.location": "An address, GPS coordinates, a room name or a video-call link.",
      "tag.g": "A geohash, so clients can search events near a place.",
      "field.geohash":
        "Geohash characters (0–9 and b–z without a, i, l, o). Longer means more precise.",
      "tag.p": "A participant. Tagging someone can be read as inviting them.",
      "field.pubkey": "The participant's public key.",
      "field.relay": "Optional relay hint.",
      "field.role": "Optional role, such as speaker or host.",
      "tag.t": "A hashtag to categorise the event.",
      "field.hashtag": "The topic, without #.",
      "tag.r": "A link: web page, document, video call or recording.",
      "field.reference": "The URL.",
      "tag.a.calendar":
        "Asks to be included in a calendar (kind 31924). The calendar owner decides.",
      "field.calendar": "Coordinate 31924:<owner pubkey>:<calendar d>.",
      "tag.name": "Old name of the title tag. Deprecated: use title.",
      "content.description": "A description of the calendar event. May be empty.",
      "content.calendar": "A description of the calendar. Required but may be empty.",
      "content.rsvp": "An optional free-form note for the organiser.",
      "time.label": "Time-based event (kind 31923)",
      "time.explain":
        "Spans from a start time to an end time, like a meeting or a talk. Addressable, so the organiser can update it.",
      "time.tag.start": "When it begins. Required.",
      "time.field.start": "Inclusive start, Unix seconds. Must be before end.",
      "time.tag.end": "When it ends. If omitted, it ends instantly.",
      "time.field.end": "Exclusive end, Unix seconds.",
      "time.tag.D": "Day index for queries. Add one per day the event touches.",
      "time.field.D":
        'floor(unix_seconds / 86400): days since 1970-01-01. Lets clients ask for "everything on this day" with a #D filter.',
      "time.tag.start-tzid": "Time zone to display the start in.",
      "time.tag.end-tzid": "Time zone of the end; defaults to start_tzid.",
      "time.field.tzid": "An IANA time zone name such as Europe/Madrid or America/Costa_Rica.",
      "example.meetup": "Alice's Nostr meetup",
      "example.meetup.explain":
        "18:00–20:00 UTC on 2025-01-18, shown in Madrid time. D 20106 is that day's index. Bob is invited as a speaker, and the event asks to join Alice's calendar.",
      "date.label": "Date-based event (kind 31922)",
      "date.explain":
        "All-day or multi-day events where the time and zone do not matter: holidays, trips, anniversaries.",
      "date.tag.start": "First day. Required.",
      "date.field.start": "Inclusive start date, YYYY-MM-DD.",
      "date.tag.end": "Day after the last day. If omitted, a single day.",
      "date.field.end": "Exclusive end date, YYYY-MM-DD.",
      "example.vacation": "Carol's photo trip",
      "example.vacation.explain": "From 10 February up to (not including) 14 February: four days.",
      "calendar.label": "Calendar (kind 31924)",
      "calendar.explain":
        "A named collection of calendar events, such as work, travel or meetups. A user can have several.",
      "tag.a.event": "A calendar event in this collection, or the one an RSVP answers.",
      "field.calendar-event": "Coordinate 31922 or 31923:<author pubkey>:<d>.",
      "example.calendar": "Alice's calendar",
      "rsvp.label": "RSVP (kind 31925)",
      "rsvp.explain":
        "Anyone's answer to a calendar event, invited or not. Addressable, so changing your mind replaces it.",
      "rsvp.tag.e": "Optionally pins the answer to one revision of the calendar event.",
      "rsvp.field.e": "Id of that revision.",
      "rsvp.tag.status": "The answer. Required.",
      "rsvp.field.status": "accepted, declined or tentative.",
      "rsvp.status.accepted": "Will attend.",
      "rsvp.status.declined": "Will not attend.",
      "rsvp.status.tentative": "Might attend.",
      "rsvp.tag.fb":
        "Whether the user is free or busy during the event. Leave it out when declining.",
      "rsvp.field.fb": "free or busy.",
      "rsvp.fb.free": "The user stays available for other things.",
      "rsvp.fb.busy": "The time is blocked.",
      "rsvp.tag.p": "The organiser, so they can easily find all RSVPs to their events.",
      "rsvp.field.p": "The calendar event author's pubkey.",
      "example.rsvp": "Bob accepts",
      "example.rsvp.explain":
        "The a tag names Alice's meetup; the p tag lets Alice query every RSVP addressed to her.",
      "example.rsvp-declined": "Dave declines",
      "flow.rsvp.label": "From invitation to RSVP",
      "flow.rsvp.explain":
        "An organiser creates an event, files it in a calendar and people answer.",
      "flow.rsvp.create": "Alice publishes a time-based event and p-tags her speakers.",
      "flow.rsvp.calendar": "Her calendar references the event with an a tag.",
      "flow.rsvp.answer": "Bob replies with an RSVP pointing at the event's coordinate.",
      "how.two-types.title": "Two kinds of calendar event",
      "how.two-types.body":
        "Kind 31922 for whole days (dates, no time zone) and kind 31923 for timed events (Unix timestamps). Both are addressable: same author, kind and d tag means the same event, updated.",
      "how.time.title": "Make it findable by day",
      "how.time.body":
        'Timed events carry D tags with the day index, so a client can ask relays for {"kinds":[31923], "#D":["20106"]} to fill one day of a calendar view.',
      "how.invite.title": "Invite people with p tags",
      "how.invite.body":
        "Each p tag names a participant with an optional relay and role. Clients may prompt those users to RSVP.",
      "how.calendar.title": "Group events into calendars",
      "how.calendar.body":
        "A kind 31924 calendar lists events with a tags. Others can ask to be added by putting the calendar's coordinate in their own event; the owner accepts by adding it.",
      "how.rsvp.title": "Answer with an RSVP",
      "how.rsvp.body":
        "Kind 31925 points at the event with an a tag (and optionally a revision with e), says accepted, declined or tentative and may add free or busy.",
      "related.01": "All four kinds are addressable events.",
      "related.09": "Calendar events can be deleted with deletion requests.",
      "related.51": "Calendars work like NIP-51 sets of calendar events.",
      "related.19": "Link to a calendar event with an naddr.",
    },
  },
  n53: {
    title: "Live Streaming and Spaces",
    summary:
      "Describes live streams and audio/video rooms as events that update while they run: who is hosting, where to watch, how many people are in. Viewers chat with kind 1311 messages, and listeners in a room signal their presence and raised hands.",
    text: {
      "tag.d": "Identifies this activity among the author's others. Use a new d for each activity.",
      "field.d": "A unique string.",
      "tag.title": "Name of the stream or meeting.",
      "tag.summary": "A short description.",
      "tag.image": "Preview image.",
      "field.text": "Free text.",
      "field.url": "A URL.",
      "tag.t": "A hashtag.",
      "field.hashtag": "The topic, without #.",
      "tag.starts": "Start time. Update it when the status changes to live.",
      "tag.ends": "End time. Update it when the status changes from live.",
      "field.timestamp": "Unix seconds.",
      "tag.status": "Where the activity is in its life cycle.",
      "field.status": "One of the allowed status values.",
      "status.planned": "Announced, not started yet.",
      "status.live": "Happening now. Clients may treat it as ended after an hour without updates.",
      "status.ended": "Over. The event may now point to a recording.",
      "tag.current": "How many people are in right now.",
      "tag.total": "How many people joined in total.",
      "field.count": "A whole number.",
      "tag.p": "A participant and their role. Keep the list short (under about 1000).",
      "field.pubkey": "The participant's public key.",
      "field.relay": "Optional relay hint; may be empty.",
      "field.role": "A displayable role, such as Host, Speaker, Moderator or Participant.",
      "field.proof":
        'Optional proof the person agreed to take part: their signature over SHA-256 of the activity\'s a coordinate (kind:pubkey:d), hex. Without it, clients may show them as "invited".',
      "tag.relays": "Relays where the activity's chat and related events live.",
      "field.relay-url": "A relay URL. Repeat for several.",
      "tag.a": "The activity this event belongs to.",
      "field.activity": "Coordinate kind:pubkey:d of the stream, space or meeting.",
      "field.marker": 'Optional marker; examples use "root".',
      "content.empty": "Empty. Everything is in tags.",
      "content.usually-empty": "Usually empty; may hold extra metadata.",
      "live.label": "Live stream (kind 30311)",
      "live.explain":
        "An addressable event the host keeps updating during the stream: status, participants, counts. Link to it with an naddr plus the a tag.",
      "live.tag.streaming": "Where to watch it live.",
      "live.field.streaming": "Stream URL, for example an HLS .m3u8 playlist.",
      "live.tag.recording": "Where to watch it afterwards.",
      "live.tag.pinned": "A chat message the host pinned. Repeat for several.",
      "live.field.pinned": "Id of a kind 1311 message.",
      "example.live": "Alice is live",
      "example.live.explain":
        "Alice hosts, Bob speaks, 42 people are watching. Each update replaces the previous version of this event.",
      "example.ended": "The same stream, ended",
      "example.ended.explain":
        "Same d tag, so this replaces the live version: status ended, an end time and a recording link.",
      "chat.label": "Live chat message (kind 1311)",
      "chat.explain": "A chat message in a live activity's channel.",
      "chat.content": "The message text.",
      "chat.tag.e": "The message this one replies to.",
      "chat.field.e": "Id of the parent chat message.",
      "chat.tag.q": "Quotes an event cited in the content with a nostr: link.",
      "chat.field.q": "An event id or an event address.",
      "chat.field.q-pubkey": "The quoted author's pubkey, when quoting a regular event.",
      "example.chat": "Carol asks a question",
      "space.label": "Meeting space (kind 30312)",
      "space.explain":
        "A virtual room that can host many meetings: its name, how to join and who runs it. Must have at least one Host.",
      "space.tag.room": "Display name of the room. Required.",
      "space.tag.status": "Whether people can get in. Required.",
      "space.status.open": "Anyone can join.",
      "space.status.private": "Restricted, for example invite-only or paid.",
      "space.status.closed": "Not in operation.",
      "space.tag.service": "URL to join the room. Required.",
      "space.tag.endpoint": "API endpoint for room status or info.",
      "example.space": "Dave's Delta Hall",
      "example.space.explain":
        "Dave hosts and Bob moderates. Meetings in this room point back to it.",
      "meeting.label": "Meeting (kind 30313)",
      "meeting.explain":
        "One scheduled or ongoing meeting inside a space. Must reference the space, have a status and a start time.",
      "example.meeting": "A planned call in Delta Hall",
      "presence.label": "Room presence (kind 10312)",
      "presence.explain":
        "Signals that the user is listening in a room. Replaceable, so a user is present in one room at a time; refresh it regularly, since clients ignore stale presence.",
      "presence.tag.hand": "Raised-hand flag.",
      "presence.field.hand": '"1" for raised, "0" (or no tag) for lowered.',
      "presence.hand.1": "Hand raised: wants to speak.",
      "presence.hand.0": "Hand down.",
      "example.presence": "Grace raises her hand",
      "example.presence.explain": "Grace is in Delta Hall and wants to ask something.",
      "flow.stream.label": "A live stream",
      "flow.stream.explain": "Announce, update, chat.",
      "flow.stream.announce": "The host publishes and keeps updating the kind 30311 event.",
      "flow.stream.chat": "Viewers send kind 1311 messages that a-tag the stream.",
      "flow.room.label": "A meeting room",
      "flow.room.explain": "Space, meeting, presence.",
      "flow.room.space": "The host defines the room once (kind 30312).",
      "flow.room.meeting": "Each meeting is a kind 30313 event referencing the room.",
      "flow.room.presence":
        "Listeners publish kind 10312 presence, raising hands when they want to talk.",
      "how.announce.title": "Announce the stream",
      "how.announce.body":
        "The host publishes kind 30311 with a d tag, title and streaming URL. It is addressable, so every update replaces the previous version.",
      "how.update.title": "Keep it current",
      "how.update.body":
        "While live, the host updates status, starts and participant counts. A live event without updates for an hour may be treated as ended; when it ends, status becomes ended and a recording can be added.",
      "how.participants.title": "List participants with roles",
      "how.participants.body":
        "p tags carry a role such as Host or Speaker and optionally a proof signature, which stops a host from claiming well-known people are taking part without their consent.",
      "how.chat.title": "Chat in the stream",
      "how.chat.body":
        "Kind 1311 messages must a-tag the activity; an e tag makes a reply. Hosts pin messages by adding pinned tags to the live event.",
      "how.spaces.title": "Rooms and meetings",
      "how.spaces.body":
        "A kind 30312 space is a persistent room; each kind 30313 meeting references it with an a tag and has its own status and times.",
      "how.presence.title": "Show who is listening",
      "how.presence.body":
        "Listeners publish kind 10312 with the room's a tag and an optional hand tag, and refresh it periodically.",
      "related.01": "Activities are addressable and replaceable events.",
      "related.19": "Activities must be linked with an naddr.",
      "related.21": "Chat messages cite events with nostr: links plus q tags.",
      "related.57": "Viewers often zap live streams.",
    },
  },
  n54: {
    title: "Wiki",
    summary:
      "An open encyclopedia where anyone can write an article on any topic. Articles are addressable kind 30818 events in Djot, many authors can cover the same topic, and readers choose versions through reactions, follows and trusted relays. Forks, merge requests and redirects are events too.",
    text: {
      "tag.d": "The topic, normalised. Every article about the same subject uses the same d tag.",
      "field.d":
        'Lowercase, spaces become "-", punctuation removed, repeated or edge dashes trimmed; non-Latin letters stay as they are. "What\'s Up?" → "whats-up".',
      "field.title": "The title to display when it differs from the d tag (capitals, punctuation).",
      "field.summary": "One line for lists.",
      "field.article": "Coordinate 30818:<author pubkey>:<topic>.",
      "field.version": "Id of a specific version of an article.",
      "field.relay": "Optional relay hint.",
      "field.marker": "fork or defer.",
      "marker.fork": "This article started as a copy of the referenced one.",
      "marker.defer":
        "The author considers the referenced version better than their own: a strong endorsement, almost a self-deletion.",
      "article.label": "Wiki article (kind 30818)",
      "article.explain":
        "An addressable article about one topic. Many people can publish their own article for the same d tag.",
      "article.content":
        "Djot markup. Links may be nostr: URIs; a reference link with no definition, like [cryptocurrency][], becomes a wikilink to that topic's article.",
      "article.tag.title": "Display title.",
      "article.tag.summary": "Short summary for lists.",
      "article.tag.a": "The article this one was forked from or defers to.",
      "article.tag.e": "The exact version forked from or deferred to.",
      "example.article": "Alice's article on relays",
      "example.article.explain":
        '[events][] and [outbox model][] have no reference definitions, so they link to the articles "events" and "outbox-model". The Alice link is a nostr: URI.',
      "example.fork": "Bob forks Alice's article",
      "example.fork.explain":
        "Both a and e carry the fork marker so readers can see exactly which version Bob started from.",
      "merge.label": "Merge request (kind 818)",
      "merge.explain": "Asks an article's author to merge changes from a forked version.",
      "merge.content": "Optional explanation of what changed and why.",
      "merge.tag.a": "The article to be updated (the merge target).",
      "merge.field.a": "Coordinate of the target article.",
      "merge.tag.e-base": "The version the changes were made against (optional).",
      "merge.field.e-base": "Id of the base version.",
      "merge.tag.e-source": 'The version to merge, marked "source".',
      "merge.field.e-source": "Id of a kind 30818 event with the proposed changes.",
      "merge.field.marker": 'Always "source".',
      "merge.tag.p": "The author being asked to merge.",
      "merge.field.p": "Their pubkey.",
      "example.merge": "Bob asks Alice to merge his addition",
      "example.merge.explain": "Alice accepts with a + reaction to this event, or rejects with -.",
      "redirect.label": "Redirect (kind 30819)",
      "redirect.explain":
        'Points one topic name at another article, for aliases ("btc" → "bitcoin") and disambiguation pages.',
      "redirect.content": "Empty.",
      "redirect.tag.d": "The topic being redirected.",
      "redirect.tag.a": "The article to show instead.",
      "example.redirect": '"relays" redirects to "relay"',
      "flow.merge.label": "Fork and merge",
      "flow.merge.explain": "Improving someone else's article.",
      "flow.merge.fork": "Bob publishes his own version with fork markers.",
      "flow.merge.request": "He sends a kind 818 merge request to Alice pointing at his version.",
      "how.topic.title": "One topic, one normalised name",
      "how.topic.body":
        'The d tag is the topic in a fixed normal form, so everyone\'s article on "Wiki Article" ends up under "wiki-article" and can be found together.',
      "how.djot.title": "Write in Djot",
      "how.djot.body":
        "Djot has one clear specification and supports footnotes, tables and math. Undefined reference links become wikilinks, so linking to another topic is just [topic][].",
      "how.many-versions.title": "Many versions, readers decide",
      "how.many-versions.body":
        "There is no single official article. Clients rank versions with + reactions, the reader's follows, wiki-specific NIP-51 lists of authors (10101) and relays (10102).",
      "how.fork.title": "Fork and defer",
      "how.fork.body":
        "Copying an article to improve it? Add a and e tags with the fork marker. If your edits were adopted upstream, publish defer tags to send your readers to that version.",
      "how.merge.title": "Ask for a merge",
      "how.merge.body":
        'A kind 818 event targets the article (a), names the base (e), the proposed version (e with "source") and the author (p).',
      "how.redirect.title": "Redirect aliases",
      "how.redirect.body":
        'A kind 30819 with d "btc" and an a tag to the bitcoin article makes clients jump there instead.',
      "related.23":
        "Long-form articles are similar but belong to one author; wiki articles are shared topics.",
      "related.21": "Article content links to profiles and events with nostr: URIs.",
      "related.25": "Reactions accept merge requests and recommend articles.",
      "related.51": "Lists of good wiki authors (10101) and relays (10102) help pick versions.",
    },
  },
  n55: {
    title: "Android Signer Application",
    summary:
      "Lets Android apps (and web pages opened on Android) ask a separate signer app to sign events and encrypt or decrypt messages, so only the signer ever holds the secret key. Requests go through intents, a background content resolver or nostrsigner: links.",
    text: {
      "actor.user": "User",
      "actor.client": "Nostr app",
      "actor.signer": "Signer app",
      "step.get-public-key.label": "get_public_key",
      "step.get-public-key.explain":
        "The app opens a nostrsigner: intent with type get_public_key. It may list permissions to pre-authorise, such as signing kind 22242 or nip44_decrypt.",
      "step.approve-login.label": "Approve login",
      "step.approve-login.explain":
        "The signer opens and the user chooses which account to share and which permissions to remember.",
      "step.pubkey-result.label": "Pubkey + package name",
      "step.pubkey-result.explain":
        "The signer returns the user pubkey in result and its package name in package. The app stores both and addresses every later request to that package.",
      "step.sign-intent.label": "sign_event intent",
      "step.sign-intent.explain":
        "The event JSON goes in the nostrsigner: URI; type, an optional id and current_user go as intent extras.",
      "step.approve-sign.label": "Approve or reject",
      "step.approve-sign.explain":
        "The user approves or rejects. A rejection comes back as RESULT_OK with rejected = true; any other result code means the signer failed.",
      "step.sign-result.label": "Signature",
      "step.sign-result.explain":
        "Extras: result (the signature), id (echoed) and event (the signed event JSON).",
      "step.content-resolver.label": "Background query",
      "step.content-resolver.explain":
        "For remembered permissions the app queries content://<package>.SIGN_EVENT with selectionArgs [payload, pubkey, current_user] and the signer never opens.",
      "step.resolver-result.label": "Result row",
      "step.resolver-result.explain":
        'A cursor with result (and event for sign_event). null or a rejected column means "not remembered" or "always reject"; do not fall back to an intent after a rejection.',
      "step.web.label": "Web: nostrsigner: link",
      "step.web.explain":
        'Web pages cannot receive intent results, so the signer appends the result to callbackUrl or copies it to the clipboard. compressionType gzip returns "Signer1" + base64(gzip(event)).',
      "how.setup.title": "Find the signer",
      "how.setup.body":
        "An Android app declares the nostrsigner scheme in its manifest queries and checks that some app handles nostrsigner: intents.",
      "how.login.title": "Log in once",
      "how.login.body":
        "get_public_key returns the user pubkey and the signer's package name. Apps store them and should not call get_public_key again while logged in.",
      "how.intents.title": "Intents: the user approves each time",
      "how.intents.body":
        "For sign_event, nip04/nip44 encrypt and decrypt, and decrypt_zap_event the app launches an intent; the signer shows a prompt and returns the result. Several requests can be batched with SINGLE_TOP flags.",
      "how.resolver.title": "Content resolver: silent when remembered",
      "how.resolver.body":
        'If the user ticked "remember my choice", the same methods work in the background through the content resolver, without opening the signer.',
      "how.web.title": "Web pages use nostrsigner: URLs",
      "how.web.body":
        "The payload is the URL path, parameters go in the query string, and the result returns via callbackUrl or the clipboard. NIP-46 is recommended for web apps instead.",
      "how.methods.title": "Methods",
      "how.methods.body":
        "get_public_key, sign_event, nip04_encrypt, nip04_decrypt, nip44_encrypt, nip44_decrypt and decrypt_zap_event. Encryption methods take the other party's pubkey; every method after login takes current_user.",
      "related.46": "Remote signing over relays; recommended for web clients.",
      "related.07": "The browser extension equivalent on desktop.",
      "related.44": "nip44_encrypt and nip44_decrypt produce and read NIP-44 payloads.",
      "related.42": "Apps often pre-authorise signing kind 22242 auth events.",
    },
  },
  n56: {
    title: "Reporting",
    summary:
      "A kind 1984 report flags a profile, a note or a media file as objectionable, with a type such as spam, impersonation or malware. Anyone can read reports; clients and relays decide for themselves whether to act on them, typically trusting reports from people you follow.",
    text: {
      "event.label": "Report (kind 1984)",
      "event.explain":
        "Signals that a user, an event or a blob is objectionable. What counts as objectionable is up to whoever reads the report.",
      content: "Optional extra information from the reporter.",
      "tag.p": "The user being reported. Always required, even when reporting a note.",
      "field.pubkey": "Their public key.",
      "tag.e": "The note being reported, if any.",
      "field.event-id": "Id of the reported event.",
      "tag.x":
        "A media file (blob) being reported, by hash. Requires an e tag for the event that contains it.",
      "field.blob-hash": "SHA-256 of the file.",
      "tag.server": "A media server where the reported file may be found.",
      "field.server": "Server or file URL.",
      "field.report-type":
        "Why it is reported. Goes in third position of the tag naming what is reported.",
      "type.nudity": "Nudity or pornography.",
      "type.malware": "Virus, trojan, spyware, ransomware and the like.",
      "type.profanity": "Profanity or hateful speech.",
      "type.illegal": "Something that may be illegal in some jurisdiction.",
      "type.spam": "Spam.",
      "type.impersonation": "Someone pretending to be someone else (profile reports only).",
      "type.other": "Anything else.",
      "tag.L": "A NIP-32 label namespace for finer classification.",
      "tag.l": "A NIP-32 label within that namespace.",
      "field.namespace": "The label namespace, such as social.nos.ontology.",
      "field.label": "The label value.",
      "example.note": "Grace reports a spam note",
      "example.note.explain":
        "The report type sits on the e tag because the note is what is reported; the p tag names its author.",
      "example.impersonation": "Erin reports an impersonator",
      "example.impersonation.explain":
        "The content names the real profile with a nostr: link; NIP-32 labels add a machine-readable category.",
      "example.blob": "Dave reports a malware file",
      "example.blob.explain":
        "x names the file by hash, e the event that shared it, server where it is hosted.",
      "how.target.title": "Say what you are reporting",
      "how.target.body":
        "Always p-tag the user. Add an e tag for a specific note, or an x tag (plus e) for a media file.",
      "how.type.title": "Say why",
      "how.type.body":
        'Put the report type in third position of the reported item\'s tag: ["e", id, "spam"], ["p", pubkey, "impersonation"]. Add NIP-32 labels for detail.',
      "how.blobs.title": "Reporting media files",
      "how.blobs.body":
        "For a file, the x tag holds its hash; server tags help moderators find the copy on media servers.",
      "how.clients.title": "Clients use reports from people you trust",
      "how.clients.body":
        "For example, if three or more people you follow report a profile for nudity, a client could blur its images. Reports from strangers carry little weight.",
      "how.relays.title": "Relays should not auto-moderate",
      "how.relays.body":
        "Reports are easy to fake in bulk, so automatic takedowns are discouraged. Relay admins may act on reports from trusted moderators.",
      "related.32": "Labels (L and l tags) add structured categories to reports.",
      "related.51": "Mute lists are the personal counterpart to public reports.",
      "related.B7": "Blossom servers host the blobs that x tags identify.",
    },
  },
  n57: {
    title: "Lightning Zaps",
    summary:
      "Zaps are Lightning tips recorded on Nostr. The sender signs a zap request and gives it to the recipient's Lightning wallet instead of publishing it; once the invoice is paid, the wallet publishes a zap receipt so everyone can see who zapped what.",
    text: {
      "field.recipient": "The pubkey of the person being zapped.",
      "field.event-id": "The zapped event's id.",
      "field.address":
        "Coordinate kind:pubkey:d of a zapped addressable event, such as an article.",
      "field.kind": "The zapped event's kind, as a string.",
      "request.label": "Zap request (kind 9734)",
      "request.explain":
        "Signed by the sender but never published to relays. It travels to the recipient's LNURL server inside an HTTP request and ends up in the invoice description.",
      "request.content": "An optional message to go with the payment.",
      "request.tag.relays":
        "Where the wallet should publish the zap receipt. List the relays directly, not nested.",
      "request.field.relay": "A relay URL. Add as many as needed.",
      "request.tag.amount": "The amount the sender intends to pay. Recommended.",
      "request.field.amount": 'Millisatoshis, as a string (21 sats = "21000").',
      "request.tag.lnurl": "The recipient's LNURL pay URL, bech32-encoded. Recommended.",
      "request.field.lnurl": "A bech32 string with the prefix lnurl.",
      "request.tag.p": "Who receives the zap. Exactly one.",
      "request.tag.e":
        "The note being zapped. Include it when zapping an event rather than a person.",
      "request.tag.a": "The addressable event being zapped.",
      "request.tag.k": "The kind of the zapped event.",
      "example.note-zap": "Alice zaps Erin's ostrich note",
      "example.note-zap.explain":
        "2,100 sats (2,100,000 msats) with a comment. The receipt will go to Alpha and Gamma.",
      "example.article-zap": "Bob zaps Frank's article",
      "example.article-zap.explain":
        "An a tag targets the article as an addressable event, so the zap follows it across edits.",
      "receipt.label": "Zap receipt (kind 9735)",
      "receipt.explain":
        "Published by the recipient's wallet after the invoice is paid, to the relays from the request. It is the wallet's claim, not a proof of payment: you trust the wallet.",
      "receipt.content": "Empty.",
      "receipt.tag.p": "The recipient, copied from the zap request.",
      "receipt.tag.P": "The sender: the zap request's pubkey.",
      "receipt.field.sender": "Pubkey of whoever signed the zap request.",
      "receipt.tag.e": "The zapped event, copied from the request.",
      "receipt.tag.a": "The zapped addressable event, copied from the request.",
      "receipt.tag.k": "The zapped event's kind, copied from the request.",
      "receipt.tag.bolt11": "The paid invoice. Its amount must match the request's amount tag.",
      "receipt.field.bolt11": "A BOLT11 invoice whose description hash commits to the zap request.",
      "receipt.tag.description":
        "The full zap request, JSON-encoded. SHA-256 of this string should equal the invoice's description hash.",
      "receipt.field.description": "The signed kind 9734 event as a JSON string.",
      "receipt.tag.preimage":
        "Optional payment preimage. It is not real proof: the wallet could make it up.",
      "receipt.field.preimage": "32 bytes, hex.",
      "example.receipt": "Erin's wallet confirms Alice's zap",
      "example.receipt.explain":
        "In real life this is signed by the wallet's nostrPubkey; here Dave's demo key stands in. The description tag holds Alice's signed request byte for byte.",
      "split.label": "Zap split (zap tags on any event)",
      "split.explain":
        "An author can say who should receive zaps for an event, and in what proportion, instead of their profile's Lightning address.",
      "split.content": "The event's normal content.",
      "split.tag.zap": "One receiver of zaps for this event. Repeat for each receiver.",
      "split.field.pubkey":
        "The receiver's pubkey; clients look up their Lightning address from their profile.",
      "split.field.relay": "Where to find the receiver's kind 0 profile.",
      "split.field.weight":
        "Optional share. Clients add up all weights and pay each receiver weight/total. No weights: split equally. Some weights missing: receivers without one get nothing.",
      "example.split": "Frank splits zaps with co-authors",
      "example.split.explain": "Weights 2, 1, 1 mean Frank gets 50%, Alice and Bob 25% each.",
      "lnurlp.label": "LNURL pay endpoint",
      "lnurlp.explain":
        "The recipient's wallet describes itself here (LUD-06), resolved from their lud16 address. allowsNostr and nostrPubkey mark it as zap-capable.",
      "lnurlp.tag": 'Always "payRequest".',
      "lnurlp.callback": "Where to send the zap request to get an invoice.",
      "lnurlp.min": "Minimum amount in millisatoshis.",
      "lnurlp.max": "Maximum amount in millisatoshis.",
      "lnurlp.metadata": "LNURL metadata, a JSON-encoded array.",
      "lnurlp.allows-nostr": "true when the server accepts zap requests.",
      "lnurlp.nostr-pubkey":
        "The key the server signs zap receipts with. Clients reject receipts signed by any other key.",
      "example.lnurlp": "Erin's wallet endpoint",
      "example.lnurlp.explain":
        "Fetched from https://wallet.alpha.example/.well-known/lnurlp/erin, derived from erin@wallet.alpha.example.",
      "callback.label": "Invoice request (callback)",
      "callback.explain":
        "The client sends the signed zap request to the callback with a GET request and gets an invoice back.",
      "callback.200": "JSON with the invoice to pay.",
      "callback.pr": "The BOLT11 invoice. Its description hash commits to the zap request.",
      "callback.routes": "Legacy LNURL field, usually empty.",
      "callback.400":
        "The zap request was invalid (bad signature, several p tags, amount mismatch…).",
      "example.callback": "Alice asks Erin's wallet for an invoice",
      "example.callback.explain":
        "nostr is the signed zap request, JSON-encoded then URI-encoded; amount must equal its amount tag.",
      "flow.zap.label": "A zap from start to finish",
      "flow.zap.explain":
        "Four messages between the sender's client, the recipient's wallet and relays.",
      "flow.zap.lnurlp":
        "Resolve the recipient's Lightning address and check allowsNostr and nostrPubkey.",
      "flow.zap.request": "Sign a zap request (do not publish it).",
      "flow.zap.callback": "Send it to the callback and receive an invoice; pay it.",
      "flow.zap.receipt": "The wallet publishes the zap receipt to the requested relays.",
      "how.discover.title": "Find a zap-capable wallet",
      "how.discover.body":
        "From the recipient's lud16 (or a zap tag), the client fetches the LNURL pay endpoint. If allowsNostr is true and nostrPubkey is a valid key, zaps are supported; remember the key.",
      "how.request.title": "Sign a zap request",
      "how.request.body":
        "Kind 9734 with relays, amount, lnurl, p and optionally e, a or k. It is signed by the sender but not published.",
      "how.invoice.title": "Get an invoice for it",
      "how.invoice.body":
        "The client calls the callback with amount, nostr (the request) and lnurl. The server validates the request (one p, at most one e, matching amount) and returns an invoice whose description is exactly that request.",
      "how.receipt.title": "Wallet publishes the receipt",
      "how.receipt.body":
        "When the invoice is paid, the wallet signs a kind 9735 with the bolt11, the request in description and copies of p, P, e, a and k, and publishes it to the requested relays.",
      "how.validate.title": "Clients verify receipts",
      "how.validate.body":
        "A receipt counts only if it is signed by the recipient's nostrPubkey and the invoice amount matches the request's amount tag. Clients then show the sender and comment from the embedded request.",
      "how.split.title": "Split zaps between people",
      "how.split.body":
        "zap tags on an event redirect its zaps to one or more pubkeys with optional weights.",
      "related.01": "Requests and receipts are ordinary signed events.",
      "related.47": "Clients often pay zap invoices through Nostr Wallet Connect.",
      "related.53": "Live streams collect zaps.",
      "related.75": "Zap goals collect zaps towards a target amount.",
    },
  },
  n58: {
    title: "Badges",
    summary:
      "Anyone can design a badge and award it to people. Awards are permanent and cannot be transferred, but each recipient chooses which badges to show on their profile and in what order, and can group them into sets.",
    text: {
      "content.empty": "Empty. Everything is in tags.",
      "field.badge": "Coordinate 30009:<issuer pubkey>:<badge d> of a badge definition.",
      "field.badge-or-set": "A badge definition (30009) or a badge set (30008).",
      "field.award": "Id of the kind 8 award event.",
      "field.relay": "Optional relay hint.",
      "field.dimensions": "Optional size as <width>x<height> in pixels, such as 1024x1024.",
      "list.tag.a": "The badge being displayed. Must be followed by its matching e tag.",
      "list.tag.e":
        "The award that gave this badge to the user. Pairs with the a tag right before it.",
      "definition.label": "Badge definition (kind 30009)",
      "definition.explain":
        "Created by the issuer. Addressable, so the issuer can update the artwork or description later.",
      "definition.tag.d": "Unique name of the badge for this issuer.",
      "definition.field.d": 'Such as "bravery" or "first-relay".',
      "definition.tag.name": "Short display name.",
      "definition.field.name": 'Such as "Medal of Bravery".',
      "definition.tag.description": "What the badge means or why it is awarded.",
      "definition.field.description": "Free text.",
      "definition.tag.image": "The full-size image (1024x1024 recommended, square).",
      "definition.field.image": "Image URL.",
      "definition.tag.thumb":
        "Smaller versions of the image. Recommended sizes: 512, 256, 64, 32 and 16 pixels square.",
      "definition.field.thumb": "Thumbnail URL.",
      "example.definition": 'Alice creates the "First relay" badge',
      "example.definition.explain":
        "Two thumbnails let clients pick the right size when showing many badges.",
      "award.label": "Badge award (kind 8)",
      "award.explain":
        "Gives a badge to one or more people. Awards are immutable and non-transferable.",
      "award.tag.a": "Which badge is awarded. Exactly one.",
      "award.tag.p": "A recipient. One tag per person.",
      "award.field.p": "The recipient's pubkey.",
      "example.award": "Alice awards Bob and Grace",
      "example.award.explain": "Sign it to get the award id that Bob's profile badges point to.",
      "profile.label": "Profile badges (kind 10008)",
      "profile.explain":
        "The recipient's own choice of badges to display, in order. A NIP-51 standard list; badges not listed here are not shown.",
      "example.profile": "Bob shows his badge",
      "example.profile.explain":
        "An a/e pair: the badge definition, then the award that names Bob. Clients ignore an a without its e and vice versa.",
      "set.label": "Badge set (kind 30008)",
      "set.explain":
        'A NIP-51 set grouping accepted badges under a label, like "Conferences" or "Community".',
      "set.tag.d": "Identifier of the set.",
      "set.field.d": "A name for this group of badges.",
      "legacy.label": "Deprecated: profile badges as kind 30008",
      "legacy.explain":
        'An earlier version stored profile badges as a kind 30008 set with d "profile_badges". Clients treat it as kind 10008 and migrate.',
      "set.tag.d-legacy":
        "The old fixed identifier. Deprecated: publish a kind 10008 profile badges event instead.",
      "set.field.d-legacy": 'Always "profile_badges".',
      "set.tag.title": "Display title of the set.",
      "set.field.title": "Free text.",
      "example.set": "Bob's community badges",
      "example.legacy": "Old-style profile badges",
      "example.legacy.explain":
        "The editor flags the deprecated d tag. Clients should read it as kind 10008 and republish in the new format.",
      "flow.badge.label": "From design to display",
      "flow.badge.explain": "Issuer defines and awards, recipient decides whether to show it.",
      "flow.badge.define": "The issuer publishes a badge definition.",
      "flow.badge.award": "The issuer awards it to one or more pubkeys.",
      "flow.badge.accept": "A recipient adds the a/e pair to their profile badges.",
      "how.define.title": "Define the badge",
      "how.define.body":
        "The issuer publishes kind 30009 with a d tag and optional name, description, image and thumbnails.",
      "how.award.title": "Award it",
      "how.award.body":
        "A kind 8 event names the badge with one a tag and each recipient with a p tag. It cannot be revoked or transferred.",
      "how.accept.title": "Recipients choose what to show",
      "how.accept.body":
        "Being awarded is not the same as displaying. The user lists accepted badges as ordered a/e pairs in their kind 10008 profile badges.",
      "how.sets.title": "Group badges in sets",
      "how.sets.body":
        "Kind 30008 badge sets group pairs under a title; profile badges may also point to whole sets with an a tag.",
      "how.display.title": "Render with care",
      "how.display.body":
        "Clients may whitelist trusted issuers, show fewer badges than listed, pick thumbnails that fit the space and load the full image on tap or hover.",
      "related.51": "Profile badges and badge sets are NIP-51 lists.",
      "related.01": "Definitions and sets are addressable; awards are regular events.",
    },
  },
  n59: {
    title: "Gift Wrap",
    summary:
      "Hides who is talking to whom by nesting an event in two encrypted envelopes. An unsigned rumor goes inside a seal signed by the real author, and the seal goes inside a gift wrap signed by a throwaway key, so relays only see a random sender and the recipient.",
    text: {
      "rumor.label": "Rumor (any kind, unsigned)",
      "rumor.explain":
        "The real event, with pubkey and id but no signature. If it ever leaks it cannot be verified, which gives the author some deniability.",
      "rumor.content":
        "Whatever the inner event's kind holds: a chat message, a reaction, anything.",
      "example.rumor": "Alice's message to Bob",
      "example.rumor.explain":
        "Computing the id is allowed (and expected); signing is not. This is the only layer with the real timestamp.",
      "seal.label": "Seal (kind 13)",
      "seal.explain":
        "Wraps the rumor, encrypted to the recipient and signed by the real author. Public information: only who signed it. No recipient, and no tags except an optional expiration.",
      "seal.content": "NIP-44 payload from the author's key to the recipient's key.",
      "seal.tag.expiration":
        "Optional NIP-40 expiration. NIP-59 says seal tags must be empty, but NIP-17 says disappearing messages SHOULD repeat the gift wrap's expiration on the seal in case the seal leaks. Use a different random time than the wrap's so the two layers cannot be matched.",
      "seal.field.expiration": "Unix time after which the seal should be deleted.",
      "seal.plaintext": "The rumor as JSON.",
      "seal.plaintext.rumor": "An unsigned event. A seal must never contain a signed event.",
      "example.seal": "Alice seals her rumor for Bob",
      "example.seal.explain":
        "Bob's demo key decrypts the content to Alice's rumor. Its created_at is an hour earlier than the rumor's to blur timing.",
      "wrap.label": "Gift wrap (kind 1059 or 21059)",
      "wrap.explain":
        "Wraps the seal, encrypted to the recipient and signed by a random one-time key. Only the p tag says where it goes. 21059 is the ephemeral variant that relays do not store.",
      "wrap.content": "NIP-44 payload from the one-time key to the recipient.",
      "wrap.plaintext": "The signed seal as JSON.",
      "wrap.plaintext.seal": "A signed kind 13 seal.",
      "wrap.tag.p": "The recipient, so relays can route the wrap. The only visible link to anyone.",
      "wrap.field.p": "Recipient pubkey.",
      "wrap.field.relay": "Optional relay hint.",
      "wrap.tag.expiration": "Optional NIP-40 expiration, with its own random timestamp per layer.",
      "wrap.field.expiration": "Unix seconds.",
      "wrap.tag.nonce": "Optional NIP-13 proof of work, to show the wrap is not spam.",
      "wrap.field.nonce": "The mined nonce.",
      "wrap.field.target": "Target difficulty in leading zero bits.",
      "example.wrap": "The wrap delivered to Bob",
      "example.wrap.explain":
        "Grace's demo key stands in for the random one-time key that real clients generate per wrap. Decrypt it as Bob to find Alice's seal.",
      "example.ephemeral": "Ephemeral wrap (kind 21059)",
      "example.ephemeral.explain":
        "Same structure, for real-time uses such as live chat or games where nobody needs the message later.",
      "flow.wrap.label": "Wrapping a message",
      "flow.wrap.explain": "Three layers, built inside out.",
      "flow.wrap.rumor": "Write the event and remove the signature: a rumor.",
      "flow.wrap.seal": "Encrypt it to the recipient, sign as yourself: a seal.",
      "flow.wrap.wrap":
        "Encrypt the seal with a fresh random key, tag the recipient, sign with that key: a gift wrap.",
      "how.rumor.title": "Start with a rumor",
      "how.rumor.body":
        "Create the real event but do not sign it. Its created_at is the canonical time of the message.",
      "how.seal.title": "Seal it",
      "how.seal.body":
        "JSON-encode the rumor, NIP-44 encrypt it from your key to the recipient's, and put it in a kind 13 with empty tags, signed by you. The seal proves authorship to the recipient only.",
      "how.wrap.title": "Wrap it",
      "how.wrap.body":
        "Generate a one-time key, NIP-44 encrypt the seal to the recipient with it, and publish kind 1059 with a p tag for the recipient, signed by the one-time key. Observers cannot tell who sent it.",
      "how.timestamps.title": "Blur the timestamps",
      "how.timestamps.body":
        "Seal and wrap timestamps should be randomised into the past (up to two days), independently, so they cannot be matched to the moment of sending.",
      "how.deliver.title": "Deliver selectively",
      "how.deliver.body":
        "Send the wrap only to the recipient's read relays, ideally ones that require NIP-42 AUTH and serve kind 1059 only to the tagged recipient. For several recipients, wrap separately for each, including a copy for yourself.",
      "how.unwrap.title": "Unwrap",
      "how.unwrap.body":
        "The recipient decrypts the wrap to get the seal, checks the seal's signature, decrypts it to get the rumor and checks that the rumor's pubkey matches the seal's.",
      "related.44": "Both layers use NIP-44 encryption.",
      "related.17": "Private direct messages are gift-wrapped kind 14 rumors.",
      "related.42": "Relays may require AUTH before accepting or serving gift wraps.",
      "related.13": "Proof of work can make anonymous wraps more expensive to spam.",
      "related.40": "Each layer may carry its own expiration.",
      "related.62": "Vanish requests make relays delete wraps addressed to the requester.",
    },
  },
} satisfies NipStringsRange;
