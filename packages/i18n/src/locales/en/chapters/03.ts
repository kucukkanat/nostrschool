// Owner: chapter 03 agent. UI strings for chapter 03 (events) components.
// Adding a key? Also add it to ../../es/chapters/03.ts (English placeholder + `// TODO(es)`).
export const ch03 = {
  title: "Anatomy of an event",
  summary: "Every post, like and profile is a signed JSON event. Take one apart.",
  sampleContent: "Hello Nostr! This is my first signed note.",
  fields: {
    heading: "The seven fields",
    select: "Explain the {field} field",
    flagged: "Verification blames this field",
    id: {
      label: "id",
      short: "The event's fingerprint: a SHA-256 hash of everything else.",
      long: "Take pubkey, created_at, kind, tags and content, line them up in a fixed JSON array, hash the bytes with SHA-256 and write the 32-byte result as 64 hex characters. Change anything, even one letter, and the id changes completely. That is why it doubles as a tamper seal and a unique name.",
    },
    pubkey: {
      label: "pubkey",
      short: "Who wrote it: the author's 32-byte public key.",
      long: "The author's x-only secp256k1 public key, as 64 hex characters. Anyone can check the signature against it. Apps show it as an npub, but on the wire it is always hex.",
    },
    created_at: {
      label: "created_at",
      short: "When the author says they wrote it (Unix seconds).",
      long: "Seconds since 1 January 1970 (UTC). The author picks it, so it is a claim, not proof. Relays may reject events too far in the past or future, and clients sort feeds by it.",
    },
    kind: {
      label: "kind",
      short: "What sort of event this is: a number from 0 to 65535.",
      long: "Kind 1 is a short text note, 0 is a profile, 3 a follow list, 7 a reaction. The number also tells relays how to store it: regular, replaceable, ephemeral or addressable.",
    },
    tags: {
      label: "tags",
      short: "A list of labelled lists: links to other events, people, topics.",
      long: 'Each tag is an array of strings whose first item is its name. ["e", id] points at another event, ["p", pubkey] mentions a person, ["t", "nostr"] adds a hashtag. Single-letter tags are indexed, so relays can find events by them.',
    },
    content: {
      label: "content",
      short: "The payload: your text, or data whose meaning depends on the kind.",
      long: "For a kind 1 note it is plain text. For other kinds it can be JSON (a profile), an emoji (a reaction) or encrypted data (a private message). It is always a string.",
    },
    sig: {
      label: "sig",
      short: "The author's Schnorr signature over the id.",
      long: "A 64-byte BIP-340 Schnorr signature of the id, made with the author's secret key (128 hex characters). Only the key holder can make it; anyone can check it with the pubkey.",
    },
  },
  createdAtHuman: "Written {date}",
  kindUnknown: "Kind {kind} (not in our table)",
  tags: {
    heading: "Tags, one by one",
    empty: "No tags on this event.",
    indexed: "indexed",
    indexedHint: "Single-letter tag: relays can filter by it as #{name}",
    names: {
      e: "e: points at another event (reply, quote, thread root)",
      p: "p: mentions or notifies a person by pubkey",
      a: "a: points at an addressable event (kind:pubkey:d-tag)",
      t: "t: a hashtag",
      d: "d: the identifier of an addressable event",
      q: "q: quotes another event",
      r: "r: a reference to a URL or relay",
      imeta: "imeta: metadata for an attached file (url, size, hash…)",
      client: "client: the app that published it",
      other: "{name}: a custom tag; meaning depends on the kind's NIP",
    },
  },
  lab: {
    title: "The event lab",
    description:
      "An event signed by Alice. Edit it and watch the id and signature get recomputed, or switch sides and try to sneak in a change without her key.",
    modeLabel: "Who are you?",
    modes: {
      author: "Alice (I hold the key)",
      forger: "A forger (no key)",
    },
    modeHint: {
      author: "Every edit is re-signed automatically, so the event stays valid.",
      forger: "Your edits change the bytes, but you cannot make a new signature.",
    },
    contentLabel: "content",
    timeLater: "created_at +1 s",
    timeEarlier: "created_at −1 s",
    tamperHeading: "Tamper with one byte",
    tamper: {
      content: "Flip a letter in content",
      created_at: "Nudge created_at by 1 s",
      id: "Flip one digit of the id",
      sig: "Flip one digit of the sig",
    },
    resign: "Re-sign with Alice's key",
    reset: "Start over",
    noKey: "Nice try! Forgers can't re-sign: only Alice has her secret key.",
    view: {
      label: "View",
      exploded: "Exploded",
      json: "Raw JSON",
    },
    avalanche: {
      one: "{count} of 64 id digits changed after your edit",
      other: "{count} of 64 id digits changed after your edit",
    },
    avalancheIdle: "Edit something and watch the id scramble.",
    avalancheLabel: "id digits that changed",
    narration: {
      ready: "Alice's note is signed and valid.",
      edited: "You edited the {field}. Recomputing the id and checking the signature.",
      resigned: "Re-signed with Alice's key. Fresh id, fresh signature.",
      tampered: "One byte of {field} was changed after signing.",
      modeChanged: "You are now playing: {mode}.",
      reset: "Back to Alice's original note.",
    },
    mascot: {
      valid: "All good: the math checks out!",
      invalid: "Eek! The signature doesn't match!",
    },
  },
  pipeline: {
    title: "Verification pipeline",
    description:
      "What every client and relay does before trusting an event: serialize, hash, compare the id, check the signature.",
    stages: {
      serialize: {
        label: "Serialize",
        description: "Line up [0, pubkey, created_at, kind, tags, content] as compact JSON.",
      },
      hash: {
        label: "SHA-256",
        description: "Hash the UTF-8 bytes. The result is the id the event should have.",
      },
      compare: {
        label: "Compare id",
        description: "Does the computed id equal the id the event claims?",
      },
      schnorr: {
        label: "Check signature",
        description: "Does the Schnorr signature match this id and pubkey?",
      },
    },
    idMatch: "Match ✓",
    idMismatch: "Mismatch ✗",
    sigValid: "Valid ✓",
    sigInvalid: "Invalid ✗",
    skipped: "Skipped",
  },
  verdict: {
    valid: "Valid: signed by this pubkey and untouched.",
    "id-mismatch":
      "Invalid: the id is not the hash of this content. Something changed after signing.",
    "bad-signature":
      "Invalid: the id matches, but the signature was not made by this pubkey's key.",
    "invalid-pubkey": "Invalid: the pubkey is not a valid secp256k1 public key.",
    malformed: "Invalid: the event is not shaped like a Nostr event.",
  },
  inspector: {
    title: "Event inspector",
    description:
      "Paste any Nostr event JSON. We'll check its id and signature right here in your browser and explain every field.",
    inputLabel: "Event JSON",
    placeholder: '{ "id": "…", "pubkey": "…", "created_at": 1735689600, … }',
    inspect: "Inspect",
    loadSample: "Load a sample",
    loadTampered: "Load a tampered sample",
    clear: "Clear",
    empty: "Paste an event above, or load a sample to start.",
    errorTitle: "That's not a valid event yet",
    errors: {
      "invalid-json": "This isn't valid JSON: {message}",
      "not-an-object": "An event must be a JSON object { … }.",
      "missing-field": "The {field} field is missing.",
      "invalid-field": "The {field} field has the wrong format: {message}",
      "invalid-tags": 'tags must be an array of arrays of strings, like [["t", "nostr"]].',
    },
    resultHeading: "Result",
    computedId: "Computed id",
    claimedId: "Claimed id",
    serialized: "Serialized (what gets hashed)",
    privacy: "Nothing leaves your browser: verification runs locally.",
  },
};
