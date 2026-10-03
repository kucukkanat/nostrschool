// Owner: chapter 04 agent. UI strings for chapter 04 (relays) components.
// Adding a key? Also add it to ../../es/chapters/04.ts (English placeholder + `// TODO(es)`).
export const ch04 = {
  title: "Relays & the wire protocol",
  summary: "Watch REQ, EVENT, EOSE and friends fly between clients and relays.",
  lanes: {
    client: "Your client",
    alpha: "Relay Alpha",
    beta: "Relay Beta",
    gamma: "Relay Gamma",
    delta: "Relay Delta (paid)",
  },
  verbs: {
    REQ: "Client asks for events matching some filters, and keeps listening for new ones.",
    EVENT:
      "Carries one signed event: client to relay when publishing, relay to client when answering a REQ.",
    EOSE: "End Of Stored Events: the relay has sent everything it already had. New events may still follow.",
    OK: "The relay's receipt for a published event: true (stored) or false (refused), plus a reason.",
    CLOSE: "Client hangs up one subscription. The connection stays open for others.",
    CLOSED: "Relay ends a subscription on its own, with a machine-readable reason.",
    NOTICE: "A human-readable message from the relay. Clients usually just log it.",
    AUTH: "Relay sends a challenge; client answers with a signed kind 22242 event to prove who it is.",
    COUNT: "Asks how many events match, instead of sending them all.",
    custom: "Not a Nostr message.",
  },
  theater: {
    title: "The wire, one packet at a time",
    description:
      "A sequence diagram: your client on the left, relays on the right. Each arrow is one JSON message on a WebSocket. Step through it, play it, or drag the scrubber.",
    scenarioLabel: "Pick a conversation",
    legendTitle: "Packet types",
    jumpTo: "Jump to the first {verb} packet",
    notInScenario: "{verb} does not appear in this conversation",
    direction: "{from} → {to}",
    rawFrame: "Raw frame on the wire",
    stepOf: "Packet {n} of {total}",
    scenarios: {
      read: {
        label: "Read a feed",
        intro:
          "Your client wants Alice's two latest notes. It asks three relays at once and merges the answers.",
        steps: {
          reqAlpha:
            'Your client opens subscription "feed" on Relay Alpha: Alice\'s notes, newest 2.',
          reqBeta:
            "Same REQ to Relay Beta. Asking several relays means one slow or dead relay can't blank your feed.",
          reqGamma:
            "And to Relay Gamma. Relays never talk to each other, so the client does the asking.",
          eventAlpha1:
            "Alpha answers with Alice's newest note, wrapped in an EVENT tagged with the subscription id.",
          eventBeta1:
            "Beta sends the very same note. Same id, so your client shows it once. Deduplication is the client's job.",
          eventAlpha2:
            "Alpha sends the second note. Your client verifies every signature itself: relays are never trusted.",
          eoseAlpha:
            "EOSE from Alpha: that's all it had stored. Time to stop the loading spinner for Alpha.",
          eoseBeta:
            "EOSE from Beta. The subscription stays open, so brand-new notes would still stream in.",
          closedGamma:
            'Gamma refuses with CLOSED and a "rate-limited:" reason. No drama: two relays already answered.',
          closeAlpha: "Done reading. Your client sends CLOSE so Alpha stops sending updates.",
          closeBeta: "And CLOSE to Beta. The WebSocket stays open for the next REQ.",
        },
      },
      publish: {
        label: "Publish a note",
        intro:
          "Alice posts a note. Her client sends the same signed event to three relays for redundancy.",
        steps: {
          eventAlpha:
            "Alice's client sends EVENT to Relay Alpha. No subscription id: this is a publish.",
          eventBeta:
            "The exact same signed event goes to Relay Beta. Any relay can store it; nobody can alter it.",
          eventGamma: "And to Relay Gamma. More copies, more places for followers to find it.",
          okAlpha: "Alpha replies OK true: stored. The OK names the event id it is answering.",
          okBeta:
            'Beta says OK true with "duplicate:". It already had this event, which still counts as success.',
          noticeGamma:
            "Gamma sends a NOTICE: a human-readable heads-up. Clients usually log it and move on.",
          okGamma:
            'Gamma refuses: OK false, "pow:" (it wants proof of work). Two of three accepted, so the note is out there.',
        },
      },
      auth: {
        label: "Log in to a relay",
        intro:
          "Alice asks a paid relay for her private messages. The relay first wants proof she is Alice (NIP-42).",
        steps: {
          reqDelta: "Alice's client asks Relay Delta for gift-wrapped messages addressed to her.",
          authChallenge:
            'Delta replies with AUTH and a random challenge string: "prove who you are".',
          closedDelta:
            'Then CLOSED with "auth-required:". It won\'t hand out private mail to strangers.',
          authEvent:
            "The client signs a kind 22242 event containing the relay URL and the challenge, and sends it in AUTH.",
          okAuth:
            "Delta checks the signature and replies OK true. This connection is now logged in as Alice.",
          reqAgain: "The client repeats the REQ on the same connection.",
          eventWrap:
            "This time Delta sends the gift wrap. Only Alice's key can open it (chapter 8).",
          eoseDelta: "EOSE: nothing else stored.",
          closeDelta:
            "CLOSE. Note that Alice's secret key never left her device, only a signature did.",
        },
      },
    },
    notebook: {
      title: "Your client's notebook",
      description: "Relays just answer. Everything below is the client's own bookkeeping.",
      open: "Open subscriptions",
      received: "EVENT messages received",
      unique: "Unique events shown",
      accepted: "Relays that stored the note",
      rejected: "Relays that refused",
      authed: "Logged in to",
      none: "none",
      dedupe: "{dupes} duplicate copy ignored",
      dedupePlural: "{dupes} duplicate copies ignored",
    },
    done: {
      read: "Feed loaded from 2 of 3 relays, duplicates merged.",
      publish: "Published to 2 of 3 relays. One refusal is no problem.",
      auth: "Logged in with a signature, not a password.",
    },
  },
  live: {
    title: "Real frames from real relays",
    description:
      "Send one REQ (latest 3 text notes) and watch the raw JSON come back. Read-only: we never publish.",
    fixtureBadge: "Practice relays",
    liveBadge: "LIVE",
    fixtureHint: "You're on practice relays. Turn on Live mode in the header to talk to real ones.",
    liveHint: "Live mode is on: these frames come from {relays}.",
    send: "Send REQ",
    stop: "Send CLOSE",
    clear: "Clear log",
    empty: 'No frames yet. Press "Send REQ".',
    out: "sent",
    in: "received",
    logLabel: "Raw WebSocket frames",
    frameLabel: "{direction} {verb} {relay}",
    stats: "{frames} frames · {events} events · {eose} of {relays} relays sent EOSE",
    status: {
      idle: "Idle.",
      waiting: "Waiting for relays…",
      done: "All relays sent EOSE. Subscription closed.",
      closed: "Subscription closed.",
    },
    error: "{relay}: {message}",
    truncated: "… ({count} more characters)",
  },
  redundancy: {
    title: "Don't put all your notes in one relay",
    description:
      "Pick which relays your note is published to, then knock relays offline. Can your followers still find it?",
    publishTo: "Publish to {relay}",
    knockOut: "Knock {relay} offline",
    bringBack: "Bring {relay} back",
    online: "online",
    offline: "offline",
    hasCopy: "has a copy",
    noCopy: "no copy",
    copies: "Copies still reachable: {alive} of {published}",
    safe: "Your note is still findable.",
    lost: "Your note is unreachable right now!",
    unpublished: "Your note isn't published anywhere yet.",
    chaos: "Knock out a relay with a copy",
    reset: "Reset",
    changed: "{relay} is now {state}.",
  },
};
