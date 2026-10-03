// Owner: chapter 01 agent. UI strings for chapter 01 (why-nostr) components.
// Adding a key? Also add it to ../../es/chapters/01.ts (English placeholder + `// TODO(es)`).
export const ch01 = {
  title: "Why Nostr?",
  summary: "What goes wrong when one company owns the server, and how relays change the game.",
  sandbox: {
    title: "Topology sandbox",
    description:
      "Five friends, four ways to wire up a social network. Knock servers and relays offline, or ban Alice, and watch who can still reach their audience.",
    instructions:
      "Click or press Enter on a server or relay to knock it offline. Then try banning Alice.",
    modelsLabel: "Network model",
    graphLabel: "{model} network diagram",
    models: {
      central: {
        label: "Centralized",
        tagline: "One company runs the only server. Everyone lives there.",
      },
      federated: {
        label: "Federated",
        tagline: "Many servers (instances) that talk to each other, like Mastodon.",
      },
      nostr: {
        label: "Nostr",
        tagline:
          "Dumb relays store notes. Your identity is a key you hold, and you post to several relays.",
      },
      bluesky: {
        label: "Bluesky",
        tagline: "Your data lives on a PDS; a relay and an AppView assemble everyone's timeline.",
      },
    },
    nodes: {
      alice: "Alice",
      bob: "Bob",
      carol: "Carol",
      dave: "Dave",
      erin: "Erin",
      platform: "BigCo",
      tea: "tea.social",
      coffee: "coffee.town",
      cocoa: "cocoa.zone",
      alpha: "alpha",
      beta: "beta",
      gamma: "gamma",
      delta: "delta",
      pdsBig: "Big PDS",
      pdsHome: "Home PDS",
      firehose: "Relay",
      appview: "AppView",
    },
    roles: {
      user: "person",
      server: "server",
      relay: "relay",
    },
    nodeButton: "{name} ({role}, {state}). Press to toggle.",
    nodeUser: "{name}: reaches {count} of {total} friends",
    up: "online",
    down: "offline",
    ban: "Ban Alice",
    unban: "Unban Alice",
    banHint: "{host} decides Alice broke the rules.",
    reset: "Reset",
    health: "Conversations still working",
    healthValue: "{alive} of {total}",
    scoreboard: "Who can still reach their audience?",
    audience: "reaches {count} of {total}",
    status: {
      full: "Fully heard",
      partial: "Partly heard",
      silenced: "Silenced",
    },
    account: {
      keys: "Identity: own keys",
      hosted: "Account on {host}",
      lost: "Account gone with {host}",
      banned: "Banned by {host}",
    },
    narration: {
      start: "All servers and relays are online. Everyone can reach everyone.",
      down: "{name} went offline.",
      up: "{name} is back online.",
      banned: "{host} banned Alice.",
      unbanned: "{host} lifted the ban on Alice.",
      reset: "Everything is back online.",
      model: "Switched to the {model} model.",
      silenced: "Silenced: {names}.",
      nobodySilenced: "Nobody lost their voice.",
      health: "{alive} of {total} conversations still work.",
    },
    verdict: {
      allGood: "Still fully connected. Nice and resilient!",
      degraded: "Some conversations broke.",
      collapsed: "The whole network is dark.",
    },
  },
  resilience: {
    title: "One bad day: the worst single outage",
    description:
      "For each model we knock out the single server or relay that hurts the most, and count how many friend-to-friend conversations survive.",
    xLabel: "Network model",
    yLabel: "Conversations surviving",
    source: "Computed live from the five-friend networks in the sandbox above.",
  },
};
