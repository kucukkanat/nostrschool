// Owner: chapter 10 agent. UI strings for chapter 10 (signing) components.
// Adding a key? Also add it to ../../es/chapters/10.ts (English placeholder + `// TODO(es)`).
export const ch10 = {
  title: "Signing & login",
  summary: "Let apps use your key without ever seeing it.",
  playground: {
    title: "Who gets to touch your key?",
    intro:
      "Same note, three ways to sign it. Pick a way, press sign, and watch the key-leak detector: it searches everything the app received for your secret key.",
    modesLabel: "How should the app get a signature?",
    modes: {
      paste: {
        label: "Paste your nsec",
        blurb: "The old, scary way: you type your secret key into the website.",
      },
      nip07: {
        label: "Browser extension",
        blurb: "NIP-07: a signer extension lives in your browser and signs on request.",
      },
      nip46: {
        label: "Remote bunker",
        blurb: "NIP-46: a signer on another device answers encrypted requests over a relay.",
      },
    },
    demoNote: "Demo keys only. Never paste a real nsec into any website — including this one.",
    app: {
      title: "The app (some website)",
      noteLabel: "Your note",
      defaultNote: "gm! Signed without sharing my key.",
      sign: "Sign & post",
      reset: "Start over",
      memoryTitle: "Everything the app received",
      memoryEmpty: "Nothing yet.",
    },
    signer: {
      title: {
        paste: "No signer at all",
        nip07: "Signer extension",
        nip46: "Bunker on your phone",
      },
      vault: "Secret key locked in here",
      vaultEmpty: "The vault is open: the app has your key",
      idle: "Waiting for a request…",
      prompt: "An app wants you to sign this note:",
      approve: "Approve",
      reject: "Reject",
      approved: "Signed. Only the signature left this box.",
      rejected: "Rejected. Nothing was signed.",
      pasteNote: "There is no one to ask: the app signs by itself, because it holds your key.",
    },
    wire: {
      title: "What travelled",
      empty: "Quiet so far.",
      from: "{from} → {to}",
      endpoints: { app: "App", signer: "Signer", relay: "Relay" },
      items: {
        pasteEvent: "Signed note",
        nip07Request: "window.nostr.signEvent(template)",
        nip07Approve: "You tapped Approve",
        nip07Response: "Signed event (id, pubkey, sig)",
        nip46ConnectReq: "kind 24133 · encrypted connect",
        nip46ConnectRes: "kind 24133 · encrypted “ack”",
        nip46PubkeyReq: "kind 24133 · encrypted get_public_key",
        nip46PubkeyRes: "kind 24133 · encrypted user pubkey",
        nip46SignReq: "kind 24133 · encrypted sign_event",
        nip46SignRes: "kind 24133 · encrypted signed event",
        publish: '["EVENT", …] to the relay',
      },
      show: "Show payload",
    },
    memory: {
      nsec: "Your secret key (nsec)",
      pubkey: "Your public key",
      template: "Unsigned note template",
      signedEvent: "Signed note",
      clientKey: "Throwaway client key (not yours!)",
      bunkerUrl: "Bunker connection URL",
      rejection: "Error: user rejected the request",
    },
    audit: {
      label: "Key-leak detector",
      idle: "Not checked yet",
      safe: "No secret key found",
      leaked: "SECRET KEY FOUND",
    },
    verdict: {
      idle: "Write a note and press “Sign & post”.",
      awaiting: "The signer is asking for your approval. Look at the signer box.",
      safe: "Signed and posted, and the app never saw your secret key.",
      leaked:
        "Posted… but the app now holds your secret key. Any bug, sneaky script or bad employee could be you, forever.",
      rejected: "You said no, so nothing was signed. That's the signer protecting you.",
    },
    error: "Something went wrong: {message}",
  },
  sequences: {
    tabsLabel: "Choose a signing flow",
    tabs: { nip07: "NIP-07 extension", nip46: "NIP-46 bunker" },
    nip07: {
      title: "NIP-07: an app asks the browser extension to sign",
      description:
        "The app talks to window.nostr, an object injected by the extension. The secret key stays inside the extension; the app only ever receives the public key and finished signatures.",
      lanes: { user: "You", app: "Web app", extension: "Signer extension", relay: "Relay" },
      messages: {
        getPk: {
          label: "getPublicKey()",
          narration: "The app asks the extension: who is logged in?",
        },
        pk: {
          label: "pubkey (hex)",
          narration: "The extension answers with your public key. That's the whole “login”.",
        },
        sign: {
          label: "signEvent(template)",
          narration: "You write a note. The app sends the unsigned template to the extension.",
        },
        ask: {
          label: "Approve?",
          narration: "The extension pops up and shows you exactly what will be signed.",
        },
        yes: {
          label: "Approve",
          narration: "You approve. The secret key is used inside the extension only.",
        },
        signed: {
          label: "event + id + sig",
          narration: "The extension returns the signed event: id, pubkey and sig added.",
        },
        publish: {
          label: '["EVENT", …]',
          narration:
            "The app publishes the signed event to a relay. No key ever left the extension.",
        },
      },
    },
    nip46: {
      title: "NIP-46: an app talks to a remote bunker through a relay",
      description:
        "The app and the bunker exchange kind 24133 events encrypted with NIP-44. The relay just forwards gibberish; only the bunker holds the secret key.",
      lanes: { user: "You", app: "Web app", relay: "Relay", bunker: "Bunker (signer)" },
      messages: {
        paste: {
          label: "bunker:// URL",
          narration:
            "You paste a bunker:// connection URL into the app: the bunker's pubkey, a relay and a one-time secret.",
        },
        connectReq: {
          label: "24133 connect",
          narration:
            "The app makes a throwaway keypair and sends an encrypted connect request to the relay.",
        },
        connectFwd: {
          label: "forward",
          narration: "The relay forwards it. It can see who it is for, but not what it says.",
        },
        ackReq: {
          label: "24133 ack",
          narration: "The bunker checks the secret and replies “ack”, encrypted back to the app.",
        },
        ackFwd: {
          label: "forward",
          narration: "The relay delivers the ack. The app and bunker are now paired.",
        },
        getPkReq: {
          label: "24133 get_public_key",
          narration: "The app asks which user key the bunker signs for, again encrypted.",
        },
        getPkFwd: {
          label: "forward",
          narration: "The relay forwards the question to the bunker.",
        },
        pkReq: {
          label: "24133 pubkey",
          narration:
            "The bunker answers with your public key. It can differ from the bunker's own key in the URL.",
        },
        pkFwd: {
          label: "forward",
          narration: "The relay delivers it. Now the app knows whose feed to show.",
        },
        signReq: {
          label: "24133 sign_event",
          narration: "You write a note. The app sends an encrypted sign_event request.",
        },
        signFwd: {
          label: "forward",
          narration: "The relay forwards the sealed request to the bunker.",
        },
        ask: {
          label: "Approve?",
          narration: "Your phone buzzes: the bunker asks you to approve the note.",
        },
        yes: {
          label: "Approve",
          narration: "You approve. The bunker signs with your key, which never leaves it.",
        },
        signedReq: {
          label: "24133 result",
          narration: "The bunker encrypts the signed event and sends it back.",
        },
        signedFwd: {
          label: "forward",
          narration: "The relay delivers the result; the app decrypts the signed event.",
        },
        publish: {
          label: '["EVENT", …]',
          narration: "The app publishes your signed note like any other event.",
        },
      },
    },
  },
  nip05: {
    title: "Is this really alice@alpha.example?",
    intro:
      "Alice's profile (kind 0) claims a NIP-05 name. Your app double-checks it by asking the domain. Pick a claim, or type your own, then verify.",
    scenariosLabel: "Try a claim",
    scenarios: {
      match: "Honest claim",
      root: "Domain-only (_@)",
      impostor: "Borrowed name",
      missing: "Unknown name",
      nodomain: "Dead domain",
      garbage: "Not an address",
    },
    inputLabel: "nip05 field in Alice's profile",
    verify: "Verify",
    claimedKey: "Alice's pubkey: {pubkey}",
    pipelineTitle: "NIP-05 verification steps",
    pipelineDescription:
      "Parse the address, build the well-known URL, fetch nostr.json from the domain, and compare the listed pubkey with the profile's pubkey.",
    stages: {
      parse: {
        label: "Parse name@domain",
        description: "Split at @; a bare domain means _@domain.",
      },
      url: { label: "Build URL", description: "https://domain/.well-known/nostr.json?name=…" },
      fetch: {
        label: "Ask the domain",
        description: "Fetch nostr.json (demo: from a pretend internet).",
      },
      compare: {
        label: "Compare pubkeys",
        description: "names[name] must equal the profile's pubkey (hex).",
      },
    },
    documentTitle: "What the domain answered (nostr.json)",
    results: {
      ok: "✓ Verified: {display} vouches for this key.",
      "invalid-format": "✗ That isn't a name@domain address.",
      "fetch-failed": "✗ The domain didn't answer, so the claim can't be checked.",
      "name-not-found": "✗ The domain doesn't list that name at all.",
      "pubkey-mismatch":
        "✗ The domain lists a different key for that name. Someone is borrowing it!",
      "invalid-document": "✗ The domain's nostr.json is malformed.",
    },
  },
  quiz: {
    q1: {
      question: "With a NIP-07 extension, what does the web app actually receive?",
      options: {
        a: {
          label: "Your nsec, encrypted",
          explanation: "No: the secret key never leaves the extension, not even encrypted.",
        },
        b: {
          label: "Your public key and finished signatures",
          explanation: "Right! The app gets getPublicKey() and signEvent() results, nothing more.",
        },
        c: {
          label: "A password it can use to log in",
          explanation: "Nostr has no passwords. Login = proving you control a key.",
        },
      },
    },
    q2: {
      question: "In NIP-46, what can the relay in the middle read?",
      options: {
        a: {
          label: "Everything, including your secret key",
          explanation: "No: the key stays in the bunker and the payloads are NIP-44 encrypted.",
        },
        b: {
          label: "The note you're signing, but not the key",
          explanation: "Close, but even the note is inside encrypted kind 24133 content.",
        },
        c: {
          label: "Only who is talking to whom (the p tag), not the content",
          explanation: "Right! The relay sees pubkeys and timestamps; the requests are encrypted.",
        },
      },
    },
    q3: {
      question: "What does a verified NIP-05 address like alice@alpha.example prove?",
      options: {
        a: {
          label: "That alpha.example lists this pubkey under the name alice",
          explanation:
            "Exactly. It's the domain vouching for a key — handy, but your identity is still the key.",
        },
        b: {
          label: "That Alice is a real, government-verified person",
          explanation: "No: anyone running a domain can list any name they like.",
        },
        c: {
          label: "That Alice's secret key is stored on alpha.example",
          explanation: "No: nostr.json only holds public keys (and optional relays).",
        },
      },
    },
  },
};
