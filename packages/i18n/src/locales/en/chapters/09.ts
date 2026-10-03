// Owner: chapter 09 agent. UI strings for chapter 09 (zaps) components.
// Adding a key? Also add it to ../../es/chapters/09.ts (English placeholder + `// TODO(es)`).
export const ch09 = {
  title: "Zaps",
  summary: "Lightning payments meet Nostr events.",
  flow: {
    title: "Follow a zap from tap to receipt",
    description:
      "Four players, ten steps. Step through how a tip travels from the sender's app, through the recipient's wallet server and the Lightning network, and back onto Nostr relays as a receipt.",
    pickLabel: "Pick a zap to follow",
    pickOption: "{sender} → {recipient} · {sats}",
    fixtureNote: "Demo data only: fake wallets, fake invoices, no real money moves.",
    sats: "{amount} sats",
    lanes: {
      client: "Sender's app",
      server: "Wallet server (LNURL)",
      lightning: "Lightning network",
      relays: "Relays",
    },
    steps: {
      profile: {
        label: "kind 0 with lud16",
        title: "1. Find the Lightning address",
        body: "The app reads {recipient}'s profile (kind 0). Its lud16 field holds a Lightning address that looks like an email: {lud16}.",
      },
      lnurlp: {
        label: "GET lnurlp",
        title: "2. Knock on the wallet's door",
        body: "The address turns into a plain web URL. The app asks that wallet server: “how do I pay {recipient}?”",
      },
      params: {
        label: "allowsNostr ✓",
        title: "3. The wallet says “I speak Nostr”",
        body: "The answer includes allowsNostr: true and a nostrPubkey: the key this wallet will use to sign receipts. Remember it — we check it later!",
      },
      sign: {
        label: "sign kind 9734",
        title: "4. Write and sign a zap request",
        body: "{sender}'s app writes a little signed note: who gets paid, how much, which post, a comment, and which relays should hear about it.",
      },
      callback: {
        label: "send to callback",
        title: "5. Hand the request to the wallet",
        body: "The zap request is NOT posted to relays. It rides along in a web request straight to the wallet server's callback URL.",
      },
      invoice: {
        label: "bolt11 invoice",
        title: "6. Get a Lightning invoice",
        body: "The server checks the request and returns an invoice for {sats}. The zap request is baked into the invoice's description, so the two are tied together.",
      },
      pay: {
        label: "pay invoice",
        title: "7. Pay!",
        body: "{sender}'s wallet pays the invoice over the Lightning network. Money moves in seconds, without touching any relay.",
      },
      settle: {
        label: "paid (preimage)",
        title: "8. The payment settles",
        body: "The wallet server sees its invoice paid. The secret preimage it reveals is Lightning's “paid” stamp.",
      },
      receipt: {
        label: "publish kind 9735",
        title: "9. The wallet publishes a zap receipt",
        body: "The wallet server signs a zap receipt with its nostrPubkey and sends it to the relays listed in the request.",
      },
      tally: {
        label: "⚡ shows on the post",
        title: "10. Everyone sees the zap",
        body: "Apps load receipts from relays, check them, and add them up. {recipient}'s post now shows ⚡ {sats}.",
      },
    },
    payloadTitle: "What travels on this step",
    zapCounter: "Zaps on this post",
    zapCounterValue: "⚡ {sats}",
    receiptToast: "Receipt published! ⚡",
    noZaps: "No zap fixtures available.",
  },
  lookup: {
    title: "Lightning address → wallet URL",
    description:
      "A lud16 Lightning address is just a short way to write a web URL. Type one to see the URL an app would fetch.",
    inputLabel: "Lightning address (lud16)",
    placeholder: "name@domain.com",
    urlLabel: "The app fetches",
    examplesLabel: "Try a demo persona",
    errors: {
      empty: "Type a Lightning address like name@domain.com.",
      format: "That doesn't look like name@domain — it needs exactly one @.",
      name: "The name part may only use a–z, 0–9, and - _ .",
      domain: "The domain needs at least one dot, like wallet.example.",
    },
  },
  checker: {
    title: "Can you trust this receipt?",
    description:
      "Anyone can publish a kind 9735 event. Pick a scenario and watch the checks an app runs before it counts a zap.",
    scenarioLabel: "Scenario",
    scenarios: {
      honest: {
        label: "Honest wallet",
        body: "The real wallet server signed a receipt for a paid invoice.",
      },
      tampered: {
        label: "Tampered",
        body: "Someone edited the invoice inside a real receipt to claim more sats, without re-signing.",
      },
      impostor: {
        label: "Impostor",
        body: "A random key signs a receipt that looks perfect, claiming 10× the amount.",
      },
      liar: {
        label: "Lying wallet",
        body: "The REAL wallet server publishes a receipt even though the invoice was never paid.",
      },
    },
    checksTitle: "Checks",
    checks: {
      signature: "Receipt signature is valid",
      signer: "Signed by the wallet's nostrPubkey",
      embedded: "Embedded zap request is a validly signed kind 9734",
      recipient: "Receipt and request name the same recipient",
      amount: "Invoice amount matches the requested amount",
    },
    passed: "passed",
    failed: "failed",
    verdictValid: "Counts as a zap ✓",
    verdictInvalid: "Rejected ✗",
    verdictValidNote: "All checks pass — but notice: you're trusting the wallet server's word.",
    verdictInvalidNote: "An honest app ignores this receipt.",
    liarNote:
      "Every check passed, yet no money moved. A receipt proves that a wallet server SAYS it was paid — not that it was.",
    receiptLabel: "The receipt being checked",
    narration: "{scenario}: {passed} of {total} checks passed. {verdict}",
  },
};
