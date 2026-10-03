import { afterEach, describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import { encodeNpub, unwrap } from "@nostrschool/protocol";
import { type MascotEventType, onAny } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import ChapterQuiz from "./ChapterQuiz.svelte";
import KeyForge from "./KeyForge.svelte";
import KeyTool from "./KeyTool.svelte";
import { sampleKeypair, TOY_GROUP, toyPublic } from "./keys-logic.ts";
import NsecGuard from "./NsecGuard.svelte";
import OneWayClock from "./OneWayClock.svelte";
import SignatureStamp from "./SignatureStamp.svelte";
import { $demoKeypair } from "./store.ts";

const t = getDictionary("en").chapters.ch02;
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const sample = sampleKeypair();

/** Records real mascot-bus traffic (the app-wide singleton), no mocks. */
const recordBus = () => {
  const seen: MascotEventType[] = [];
  const off = onAny((e) => seen.push(e.type));
  return { seen, off };
};

afterEach(() => {
  cleanup();
  $demoKeypair.set(sample);
});

const waitFor = async (check: () => boolean, timeoutMs = 3000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error("timed out");
    await tick(10);
  }
};

describe("KeyForge", () => {
  test("starts with the deterministic sample key, secret masked", () => {
    const { getByTestId } = render(KeyForge, { props: { locale: "en" } });
    expect(getByTestId("ch02-sample-badge").textContent).toContain(t.forge.sampleBadge);
    expect(getByTestId("ch02-public-hex").textContent?.trim()).toBe(sample.publicKey);
    const secret = getByTestId("ch02-secret-hex");
    expect(secret.dataset["masked"]).toBe("true");
    expect(secret.textContent).not.toContain(sample.secretKeyHex);
    expect(getByTestId("ch02-encoded-text").textContent).toBe("npub1");
    expect(getByTestId("ch02-narration").textContent).toContain("npub");
  });

  test("peek reveals and hides the secret", async () => {
    const { getByTestId } = render(KeyForge, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch02-peek"));
    expect(getByTestId("ch02-secret-hex").textContent?.trim()).toBe(sample.secretKeyHex);
    expect(getByTestId("ch02-peek").getAttribute("aria-pressed")).toBe("true");
    await fireEvent.click(getByTestId("ch02-peek"));
    expect(getByTestId("ch02-secret-hex").dataset["masked"]).toBe("true");
  });

  test("stepping reveals the npub one character at a time; skip finishes it", async () => {
    const { seen, off } = recordBus();
    const { getByTestId, queryByTestId } = render(KeyForge, {
      props: { locale: "en", autoplay: false },
    });
    const npub = unwrap(encodeNpub(sample.publicKey));
    await fireEvent.click(getByTestId("ch02-playback-forward"));
    expect(getByTestId("ch02-encoded-text").textContent).toBe(npub.slice(0, 6));
    expect(getByTestId("ch02-word-value").textContent).toContain("→");
    expect(getByTestId("ch02-bytes").querySelectorAll('[data-active="true"]')).toHaveLength(1);
    expect(getByTestId("ch02-alphabet").querySelectorAll('[data-hit="true"]')).toHaveLength(1);
    expect(getByTestId("ch02-narration").textContent).toContain("Character 1 of 58");
    await fireEvent.click(getByTestId("ch02-skip"));
    expect(getByTestId("ch02-encoded-text").textContent).toBe(npub);
    expect(getByTestId("ch02-encoded").dataset["done"]).toBe("true");
    expect(getByTestId("ch02-narration").textContent).toContain(npub);
    expect(queryByTestId("ch02-copy-npub")).not.toBeNull();
    await tick();
    expect(seen).toContain("celebrate");
    // Step back into the checksum: no bit window, a checksum tag instead.
    await fireEvent.click(getByTestId("ch02-playback-back"));
    expect(getByTestId("ch02-word-value").textContent).toContain(t.forge.checksumWord);
    expect(getByTestId("ch02-narration").textContent).toContain("Checksum character");
    off();
  });

  test("generate forges a random demo key, shares it and autoplays", async () => {
    const { seen, off } = recordBus();
    const { getByTestId } = render(KeyForge, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch02-generate"));
    const pub = getByTestId("ch02-public-hex").textContent?.trim() ?? "";
    expect(pub).not.toBe(sample.publicKey);
    expect($demoKeypair.get().publicKey).toBe(pub);
    expect(getByTestId("ch02-demo-badge").textContent).toContain(t.forge.demoBadge);
    expect(getByTestId("ch02-announce").textContent).toBe(t.forge.generatedAnnounce);
    expect(seen).toContain("keys:generated");
    expect(getByTestId("ch02-playback").dataset["playing"]).toBe("true");
    await waitFor(() => (getByTestId("ch02-encoded-text").textContent?.length ?? 0) > 6);
    off();
  });

  test("switching to nsec encodes the secret (revealed, no copy button)", async () => {
    const { getByTestId, queryByTestId } = render(KeyForge, {
      props: { locale: "en", autoplay: false },
    });
    await fireEvent.click(getByTestId("ch02-target-npub")); // no-op on the current target
    await fireEvent.click(getByTestId("ch02-target-nsec"));
    expect(getByTestId("ch02-encoder").dataset["target"]).toBe("nsec");
    expect(getByTestId("ch02-nsec-note").textContent).toBe(t.forge.nsecCopyWarning);
    expect(getByTestId("ch02-secret-hex").dataset["masked"]).toBe("false");
    expect(getByTestId("ch02-encoded-text").textContent).toBe("nsec1");
    await fireEvent.click(getByTestId("ch02-skip"));
    expect(getByTestId("ch02-encoded-text").textContent).toMatch(/^nsec1[02-9ac-hj-np-z]{58}$/);
    expect(queryByTestId("ch02-copy-npub")).toBeNull();
  });

  test("autoplay stops by itself at the end", async () => {
    const { getByTestId } = render(KeyForge, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch02-playback-play"));
    await waitFor(() => getByTestId("ch02-playback").dataset["playing"] === "true");
    // Fast-forward: jump to the last step while playing, then the timer must stop playback.
    await fireEvent.click(getByTestId("ch02-skip"));
    expect(getByTestId("ch02-playback").dataset["playing"]).toBe("false");
    await fireEvent.click(getByTestId("ch02-playback-reset"));
    await fireEvent.click(getByTestId("ch02-playback-play"));
    const scrub = getByTestId("ch02-playback-scrub") as HTMLInputElement;
    await fireEvent.input(scrub, { target: { value: "58" } });
    await waitFor(() => getByTestId("ch02-playback").dataset["playing"] === "false");
  });
});

describe("OneWayClock", () => {
  test("hop animates to the public spot, reverse brute-forces it", async () => {
    const { seen, off } = recordBus();
    const { getByTestId, queryByTestId } = render(OneWayClock, { props: { locale: "en" } });
    const slider = getByTestId("ch02-clock-slider") as HTMLInputElement;
    await fireEvent.input(slider, { target: { value: "3" } });
    expect(getByTestId("ch02-clock").dataset["mode"]).toBe("idle");
    await fireEvent.click(getByTestId("ch02-clock-hop"));
    expect(getByTestId("ch02-clock").dataset["mode"]).toBe("hopping");
    await waitFor(() => getByTestId("ch02-clock").dataset["mode"] === "landed");
    const p = unwrap(toyPublic(3));
    expect(getByTestId("ch02-clock-public").textContent).toContain(String(p));
    expect(getByTestId("ch02-clock-narration").textContent).toContain(`spot ${p}`);
    expect(getByTestId(`ch02-clock-spot-${p}`).getAttribute("class")).toContain("head");
    await fireEvent.click(getByTestId("ch02-clock-reverse"));
    await waitFor(() => getByTestId("ch02-clock").dataset["mode"] === "found");
    expect(getByTestId("ch02-clock-found").textContent).toBe("Found it after 3 guesses.");
    expect(seen).toContain("celebrate");
    // Moving the slider resets the story.
    await fireEvent.input(slider, { target: { value: "1" } });
    expect(queryByTestId("ch02-clock-found")).toBeNull();
    await fireEvent.click(getByTestId("ch02-clock-hop"));
    await waitFor(() => getByTestId("ch02-clock").dataset["mode"] === "landed");
    await fireEvent.click(getByTestId("ch02-clock-reverse"));
    await waitFor(() => getByTestId("ch02-clock").dataset["mode"] === "found");
    expect(getByTestId("ch02-clock-found").textContent).toBe("Found it after 1 guess.");
    expect(TOY_GROUP.n).toBe(61);
    off();
  });
});

describe("SignatureStamp", () => {
  test("sign, then edit: valid → invalid → valid, with mascot reactions", async () => {
    const { seen, off } = recordBus();
    const { getByTestId } = render(SignatureStamp, { props: { locale: "en" } });
    const root = getByTestId("ch02-stamp");
    expect(root.dataset["state"]).toBe("unsigned");
    await fireEvent.click(getByTestId("ch02-stamp-sign"));
    expect(root.dataset["state"]).toBe("valid");
    expect(getByTestId("ch02-stamp-sig").textContent).toMatch(/^[0-9a-f]{128}$/);
    const box = getByTestId("ch02-stamp-message") as HTMLTextAreaElement;
    await fireEvent.input(box, { target: { value: `${box.value}!` } });
    expect(root.dataset["state"]).toBe("invalid");
    expect(getByTestId("ch02-stamp-verdict").textContent).toContain(t.stamp.invalid);
    await fireEvent.input(box, { target: { value: t.stamp.defaultMessage } });
    expect(root.dataset["state"]).toBe("valid");
    await tick();
    expect(seen).toContain("signature:valid");
    expect(seen).toContain("signature:invalid");
    off();
  });
});

describe("NsecGuard", () => {
  test("judges each request and celebrates a perfect run", async () => {
    const { seen, off } = recordBus();
    const { getByTestId } = render(NsecGuard, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch02-guard-support-share"));
    expect(getByTestId("ch02-guard-support").dataset["verdict"]).toBe("danger");
    expect(getByTestId("ch02-guard-support-verdict").textContent).toContain(
      t.guard.verdicts.danger,
    );
    await fireEvent.click(getByTestId("ch02-guard-friend-refuse"));
    expect(getByTestId("ch02-guard-friend").dataset["verdict"]).toBe("overcautious");
    expect(getByTestId("ch02-guard-score").textContent).toBe("0 of 4 safe choices");
    expect(seen).toContain("warning");
    await fireEvent.click(getByTestId("ch02-guard-reset"));
    await fireEvent.click(getByTestId("ch02-guard-friend-share"));
    await fireEvent.click(getByTestId("ch02-guard-support-refuse"));
    await fireEvent.click(getByTestId("ch02-guard-podcast-share"));
    await fireEvent.click(getByTestId("ch02-guard-giveaway-refuse"));
    expect(getByTestId("ch02-guard-score").textContent).toBe(t.guard.allDone);
    expect(seen).toContain("quiz:correct");
    expect(seen).toContain("celebrate");
    off();
  });
});

describe("ChapterQuiz", () => {
  test("renders three quizzes with the right answers", async () => {
    const { getByTestId } = render(ChapterQuiz, { props: { locale: "en" } });
    for (const [q, right] of [
      ["q1", "b"],
      ["q2", "a"],
      ["q3", "c"],
    ] as const) {
      await fireEvent.click(getByTestId(`ch02-quiz-${q}-option-${right}`));
      await fireEvent.click(getByTestId(`ch02-quiz-${q}-check`));
      expect(getByTestId(`ch02-quiz-${q}`).dataset["result"]).toBe("correct");
    }
  });
});

describe("KeyTool", () => {
  const typeInto = async (el: HTMLElement, value: string) => {
    await fireEvent.input(el, { target: { value } });
  };

  test("generate shows a demo keypair with masked secrets", async () => {
    const { getByTestId } = render(KeyTool, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch02-tool-generate"));
    expect(getByTestId("ch02-tool-demo-badge")).not.toBeNull();
    expect(getByTestId("ch02-tool-value-gen-npub").textContent).toMatch(/^npub1/);
    const nsec = getByTestId("ch02-tool-value-gen-nsec");
    expect(nsec.textContent).toContain("•");
    await fireEvent.click(getByTestId("ch02-tool-reveal-gen-nsec"));
    expect(nsec.textContent).toMatch(/^nsec1[02-9ac-hj-np-z]+$/);
    await fireEvent.click(getByTestId("ch02-tool-reveal-gen-nsec"));
    expect(nsec.textContent).toContain("•");
  });

  test("convert: hex shows three readings; npub decodes; errors are localized", async () => {
    const { getByTestId, queryByTestId } = render(KeyTool, { props: { locale: "en" } });
    const input = getByTestId("ch02-tool-input");
    expect(queryByTestId("ch02-tool-error")).toBeNull();
    await typeInto(input, sample.publicKey);
    expect(getByTestId("ch02-tool-detected").textContent).toContain("hex");
    expect(getByTestId("ch02-tool-value-pub-npub").textContent).toBe(
      unwrap(encodeNpub(sample.publicKey)),
    );
    expect(getByTestId("ch02-tool-row-id-note")).not.toBeNull();
    expect(getByTestId("ch02-tool-row-sec-nsec").dataset["secret"]).toBe("true");
    await typeInto(input, "f".repeat(64));
    expect(getByTestId("ch02-tool-not-on-curve").textContent).toBe(t.tool.notOnCurve);
    await typeInto(input, unwrap(encodeNpub(sample.publicKey)));
    expect(getByTestId("ch02-tool-detected").textContent).toContain("npub");
    expect(getByTestId("ch02-tool-value-dec-hex-pubkey").textContent).toBe(sample.publicKey);
    await typeInto(input, "npub1nope");
    expect(getByTestId("ch02-tool-error").dataset["code"]).toBe("invalid-bech32");
    expect(getByTestId("ch02-tool-error").textContent?.trim()).toBe(
      t.tool.errors["invalid-bech32"],
    );
  });

  test("convert: pasting an nsec warns loudly", async () => {
    const { getByTestId } = render(KeyTool, { props: { locale: "en" } });
    const nsecRow = (await import("@nostrschool/protocol")).encodeNsec(sample.secretKey);
    await typeInto(getByTestId("ch02-tool-input"), unwrap(nsecRow));
    expect(getByTestId("ch02-tool-nsec-warning").textContent).toContain(t.tool.nsecWarning);
    expect(getByTestId("ch02-tool-value-dec-hex-pubkey").textContent).toBe(sample.publicKey);
  });

  test("build: nprofile → nevent → naddr with TLV table and field errors", async () => {
    const { getByTestId, queryByTestId } = render(KeyTool, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch02-tool-tabs-tab-build"));
    expect(queryByTestId("ch02-tool-build-error")).toBeNull();
    await fireEvent.click(getByTestId("ch02-tool-fill-sample"));
    expect(getByTestId("ch02-tool-value-build-nprofile").textContent).toMatch(/^nprofile1/);
    expect(getByTestId("ch02-tool-tlv").querySelectorAll("tbody tr")).toHaveLength(2);

    await fireEvent.click(getByTestId("ch02-tool-type-nevent"));
    await typeInto(getByTestId("ch02-tool-author"), "zz");
    expect(getByTestId("ch02-tool-build-error").dataset["field"]).toBe("author");
    expect(getByTestId("ch02-tool-build-error").textContent).toContain(t.tool.authorLabel);
    await typeInto(getByTestId("ch02-tool-author"), "");
    await typeInto(getByTestId("ch02-tool-kind"), "1");
    expect(getByTestId("ch02-tool-value-build-nevent").textContent).toMatch(/^nevent1/);
    await typeInto(getByTestId("ch02-tool-kind"), "x");
    expect(getByTestId("ch02-tool-build-error").dataset["field"]).toBe("kind");

    await fireEvent.click(getByTestId("ch02-tool-type-naddr"));
    await typeInto(getByTestId("ch02-tool-kind"), "");
    await fireEvent.click(getByTestId("ch02-tool-fill-sample"));
    expect(getByTestId("ch02-tool-value-build-naddr").textContent).toMatch(/^naddr1/);
    expect(getByTestId("ch02-tool-tlv").textContent).toContain("hello-nostr");
    expect(getByTestId("ch02-tool-tlv").textContent).toContain("30023");

    await typeInto(getByTestId("ch02-tool-relays"), "https://bad");
    expect(getByTestId("ch02-tool-build-error").textContent).toContain(t.tool.relaysLabel);
    await typeInto(getByTestId("ch02-tool-relays"), "");
    await typeInto(getByTestId("ch02-tool-hex"), "abc");
    expect(getByTestId("ch02-tool-build-error").textContent).toContain(t.tool.hexLabel.naddr);
    await typeInto(getByTestId("ch02-tool-identifier"), "y".repeat(300));
    await typeInto(getByTestId("ch02-tool-hex"), sample.publicKey);
    expect(getByTestId("ch02-tool-build-error").textContent?.trim()).toBe(
      t.tool.errors["invalid-tlv"],
    );
  });
});
