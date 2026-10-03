// Owner: chapter 12 agent. UI strings for chapter 12 (trade-offs) components.
// Adding a key? Also add it to ../../es/chapters/12.ts (English placeholder + `// TODO(es)`).
export const ch12 = {
  title: "Trade-offs",
  summary: "Spam, discovery, relay economics and key loss: an honest look.",
  platforms: {
    nostr: "Nostr",
    x: "X",
    mastodon: "Mastodon",
    bluesky: "Bluesky",
  },
  ratings: {
    good: "Strong",
    mixed: "Mixed",
    poor: "Weak",
  },
  matrix: {
    title: "The no-spin comparison matrix",
    intro:
      "Tick what matters to you and watch the ranking reshuffle. Tap any cell to read why it got that rating.",
    tableCaption: "How Nostr, X, Mastodon and Bluesky compare, criterion by criterion",
    criterionHeader: "What you care about",
    prioritiesLabel: "What matters to you?",
    prioritiesHint: "Ticked criteria count four times as much.",
    presetsLabel: "Or try a persona",
    presets: {
      balanced: "Balanced",
      dissident: "Journalist under pressure",
      casual: "Just chatting with friends",
      builder: "App developer",
    },
    rankingTitle: "Your ranking",
    scoreLabel: "{platform}: {score} out of 100",
    noWinner:
      "Notice how the winner changes with your priorities? That's the honest answer: there is no best network, only trade-offs.",
    nostrLeads: "With your priorities, Nostr comes out on top.",
    otherLeads:
      "With your priorities, {platform} comes out on top. Nostr isn't for everyone, and that's fine!",
    cellLabel: "{criterion} on {platform}: {rating}. Show why.",
    detailEmpty: "Pick a cell in the table to see the reasoning.",
    detailTitle: "{criterion} · {platform}",
    criteria: {
      identity: "You own your identity",
      censorship: "Hard to silence",
      portability: "Take your followers anywhere",
      spam: "Spam defense",
      discovery: "Finding people & posts",
      moderation: "You choose your moderation",
      availability: "Your posts stay online",
      recovery: "Account recovery",
      openness: "Anyone can build an app",
    },
    notes: {
      identity: {
        nostr:
          "Your identity is a keypair you generated yourself. No company or server can take it away.",
        x: "X owns the account. Your handle and followers exist only inside X's database.",
        mastodon:
          "Your identity is name@instance. It's tied to the server's domain, so the admin ultimately controls it.",
        bluesky:
          "Accounts are DIDs and handles can be your own domain, but most DIDs are did:plc, a directory run by Bluesky.",
      },
      censorship: {
        nostr: "No one controls all relays. A ban on one relay just means posting to another.",
        x: "One company decides who can speak, worldwide, with a single switch.",
        mastodon: "Each instance moderates its own users and can block other instances entirely.",
        bluesky:
          "The protocol is open, but today most people use Bluesky's own app view, relay and moderation.",
      },
      portability: {
        nostr:
          "Your followers follow your key, not a server. Change relays and they still find you.",
        x: "You can download an archive, but your followers can't come with you.",
        mastodon:
          "Account moves redirect followers, but your old posts stay behind and the old server must cooperate.",
        bluesky:
          "Accounts can move between hosting servers (PDSs) with followers and posts, using your DID's rotation keys.",
      },
      spam: {
        nostr:
          "No central spam team. Defense is up to relays and clients: proof-of-work, paid relays, web-of-trust filters.",
        x: "A large central trust & safety team and algorithms, but bots remain a well-known problem.",
        mastodon: "Volunteer admins moderate. Small instances can be overwhelmed by spam waves.",
        bluesky: "Central moderation plus stackable third-party labelers you can subscribe to.",
      },
      discovery: {
        nostr:
          "There's no global index. Search relays and custom feeds help, but finding people is still harder than on big platforms.",
        x: "A powerful recommendation algorithm surfaces content (whether you like its choices or not).",
        mastodon:
          "Mostly chronological; search and discovery depend on what your instance knows about.",
        bluesky: "A central index plus thousands of custom feeds anyone can build.",
      },
      moderation: {
        nostr: "Moderation is a client and relay choice: mute lists, reports, filters you pick.",
        x: "One policy for everyone, set by the company. You can't swap it.",
        mastodon: "You pick an instance whose rules you like; the admin's choices apply to you.",
        bluesky: "Bluesky moderates, and you can layer extra labelers and block lists on top.",
      },
      availability: {
        nostr:
          "Posts live as long as some relay keeps them. Free relays may prune old data; nobody guarantees forever.",
        x: "Very reliable while the company exists and keeps your account active.",
        mastodon: "Your data lives on one server. If it shuts down without warning, it's gone.",
        bluesky: "Reliable hosting today; your repository can also be exported and moved.",
      },
      recovery: {
        nostr:
          "Lose your private key and the account is gone. There's no 'forgot password' button.",
        x: "Reset by email or phone. The company can always let you back in.",
        mastodon: "Your instance admin can reset your password by email.",
        bluesky: "Password reset by email; your host manages the signing keys for you.",
      },
      openness: {
        nostr: "Open protocol, no permission needed: hundreds of independent clients and relays.",
        x: "A closed, paid API that the company can change or revoke any time.",
        mastodon: "Open ActivityPub protocol; anyone can run a server or build an app.",
        bluesky: "Open AT Protocol; anyone can build apps, feeds and labelers.",
      },
    },
  },
  scenarios: {
    title: "What could possibly go wrong?",
    intro:
      "Flip on some bad days and see how each network copes. Then flip on Nostr precautions and see what changes.",
    whatIfLabel: "What if…",
    prepLabel: "Nostr precautions",
    prepHint:
      "These only change the Nostr column: the other networks handle these problems for you (or don't).",
    allClear: "Nothing has gone wrong yet. Flip a 'what if' switch!",
    overall: "Overall: {severity}",
    narration: "Nostr: {nostr}. X: {x}. Mastodon: {mastodon}. Bluesky: {bluesky}.",
    severities: {
      fine: "No big deal",
      bumpy: "Annoying",
      ouch: "Painful",
      disaster: "Disaster",
    },
    items: {
      lostKey: {
        label: "I lose my password or private key",
        description: "Your laptop dies and you never wrote anything down.",
      },
      keyLeak: {
        label: "Someone steals my key or password",
        description: "You pasted your secret into a sketchy website.",
      },
      relayBan: {
        label: "My relay or server bans me",
        description: "The operator decides they don't want you around.",
      },
      serverGone: {
        label: "My relay or server shuts down",
        description: "The volunteer running it moves on, or the money runs out.",
      },
      spamFlood: {
        label: "Spam floods my replies",
        description: "A bot army discovers your posts.",
      },
    },
    preps: {
      backup: {
        label: "I backed up my key",
        description: "Written down safely, or saved encrypted as an ncryptsec (NIP-49).",
      },
      multiRelay: {
        label: "I publish to several relays",
        description: "My relay list (NIP-65) tells everyone where to find me.",
      },
      wot: {
        label: "My client filters by web of trust",
        description: "Only people my follows follow can reach my notifications.",
      },
    },
    outcomes: {
      nostr: {
        lostKey: "Your identity is gone for good. Make a new key and ask everyone to follow it.",
        lostKeyBackup: "Restore from your backup and carry on. Phew!",
        keyLeak:
          "The thief can post as you forever. There's no standard way to rotate a key: you must start over and warn your followers.",
        relayBan:
          "Your notes vanish from that relay. Followers who only read it lose track of you.",
        relayBanMulti:
          "Shrug. Your other relays still carry your notes, and your relay list points people there.",
        serverGone:
          "Notes stored only on that relay are lost, but your identity and follows survive.",
        serverGoneMulti: "Your notes already live on other relays. Barely noticeable.",
        spamFlood: "No central spam team will save you. Your client and relays have to filter it.",
        spamFloodWot: "Strangers outside your web of trust are filtered out. Quiet again.",
      },
      x: {
        lostKey: "Reset by email or phone. The company lets you back in.",
        keyLeak:
          "Reset your password, log out other sessions and recover the account through support.",
        relayBan:
          "Suspended. Your posts, followers and handle are gone, and there's one company to appeal to.",
        serverGone: "If X disappears or locks you out, your whole social graph goes with it.",
        spamFlood: "Central spam filters catch a lot, though you can't tune them.",
      },
      mastodon: {
        lostKey: "Your instance admin resets your password by email.",
        keyLeak: "Change your password; the admin can lock down and help restore the account.",
        relayBan:
          "Suspended on your instance. Moving your followers usually needs the old account's cooperation.",
        serverGone:
          "If the instance shuts down before you migrate, your account and posts are gone.",
        spamFlood: "Your admin moderates, but small volunteer-run instances can be overwhelmed.",
      },
      bluesky: {
        lostKey: "Reset your password by email; your hosting server manages the keys.",
        keyLeak: "Reset your password; your host and recovery keys let you regain control.",
        relayBan:
          "You can move to another host with your DID, but a takedown by Bluesky's moderation still hides you in the main app.",
        serverGone:
          "Moving to a new host is possible with your recovery key and a backup of your data.",
        spamFlood: "Central moderation plus labelers you subscribe to keep most of it away.",
      },
    },
    mascot: {
      calm: "So far so good!",
      worried: "Hmm, that one hurts…",
      panic: "Eek! Nostr has no undo button for that!",
      prepared: "A prepared nostrich survives almost anything!",
    },
  },
  pow: {
    title: "Mine a note, stop a spammer",
    intro:
      "Proof-of-work makes every note cost a little computing effort. Pick a difficulty and let your browser hunt for an id that starts with enough zero bits.",
    contentLabel: "Note text",
    defaultContent: "Hello from Nostr School!",
    difficultyLabel: "Difficulty (leading zero bits)",
    difficultyValue: "{bits} bits ≈ {attempts} tries on average",
    mine: "Start mining",
    stop: "Stop",
    reset: "Reset",
    attempts: "Attempts",
    bestBits: "Best so far",
    rate: "Hashes per second",
    nonce: "Nonce",
    currentId: "Current id",
    bestId: "Best id so far",
    bitsValue: "{bits} bits",
    idle: "Ready. Press “Start mining” to begin.",
    mining: "Mining… {attempts} tries, best is {bits} zero bits.",
    found: "Found it after {attempts} tries! Nonce {nonce} gives {bits} leading zero bits.",
    stopped: "Stopped after {attempts} tries.",
    zeroBitsHint: "Zero bits are highlighted. Each hex 0 is worth 4 bits.",
    signedTitle: "Your mined, signed note",
    spamTitle: "What would a spammer pay?",
    spamBody:
      "At {rate} hashes per second, one note costs you about {one}. A spammer posting {count} notes would need about {total}.",
    units: {
      ms: "{value} ms",
      s: "{value} seconds",
      min: "{value} minutes",
      h: "{value} hours",
      d: "{value} days",
      y: "{value} years",
    },
    caveat:
      "The catch: phones pay the same price as spam farms with fast computers, so relays rarely demand very high difficulties.",
  },
  complete: {
    title: "You graduated from Nostr School!",
    body: "Twelve chapters, from “why?” to “what's the catch?”. You now know more about Nostr than most of the people using it.",
    progress: "You've marked {done} of {total} chapters complete.",
    celebrate: "Celebrate!",
    celebrated: "Confetti thrown. Well earned.",
    mascotSay: "Congratulations, fellow nostrich. You finished the course.",
    nextTitle: "Where to next?",
    toolsTitle: "Keep practicing",
    resourcesTitle: "Go deeper",
    tools: {
      keys: "Key tool",
      inspector: "Event inspector",
      filters: "Filter playground",
      kinds: "Kinds table",
      glossary: "Glossary",
    },
    resources: {
      nips: { label: "The NIPs repository", hint: "The protocol specs, straight from the source." },
      nostrTools: { label: "nostr-tools", hint: "The JavaScript library this course uses." },
      nostrCom: { label: "nostr.com", hint: "A friendly overview with links to clients." },
      nostrHow: { label: "nostr.how", hint: "Step-by-step guides for getting started." },
      awesome: { label: "awesome-nostr", hint: "A huge community list of projects." },
    },
    externalHint: "(opens a new tab)",
  },
  quiz: {
    q1: {
      question: "What does NIP-13 proof-of-work actually measure?",
      options: {
        a: {
          label: "How many followers the author has",
          explanation: "Nope: PoW knows nothing about followers.",
        },
        b: {
          label: "The number of leading zero bits in the event id",
          explanation:
            "Right! Miners tweak a nonce tag until the id's hash starts with enough zero bits.",
        },
        c: {
          label: "How long the relay took to store the note",
          explanation:
            "Not quite. The work is done by whoever creates the event, before sending it.",
        },
      },
    },
    q2: {
      question: "Your only relay bans you. What happens to your Nostr identity?",
      options: {
        a: {
          label: "Nothing: your key still works, you just post to other relays",
          explanation: "Exactly. Relays store notes; they don't own your identity.",
        },
        b: {
          label: "It's deleted network-wide",
          explanation: "No single relay can delete you from the whole network.",
        },
        c: {
          label: "You must ask the relay for your password back",
          explanation: "There's no password: your identity is your keypair, which only you hold.",
        },
      },
    },
    q3: {
      question: "Someone steals your nsec. What's the honest answer?",
      options: {
        a: {
          label: "Click “reset password”",
          explanation: "Nostr has no password reset: there's no server that could do it.",
        },
        b: {
          label: "Relays will automatically block the thief",
          explanation: "Relays can't tell you and the thief apart: both produce valid signatures.",
        },
        c: {
          label:
            "There's no standard key rotation yet: you start a new key and tell your followers",
          explanation:
            "Correct, and that's one of Nostr's biggest open problems. Guard your key, ideally inside a signer.",
        },
      },
    },
  },
};
