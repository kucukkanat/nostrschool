/** Sample events for chapter 03: signed with the public-by-design fixture persona keys. */
import { eventsByKind, FIXTURE_NOW, getPersona } from "@nostrschool/fixtures";
import { type NostrEvent, signEvent } from "@nostrschool/protocol";

export const LAB_AUTHOR = getPersona("alice");

/** A small kind-1 note with a hashtag and a mention, so every field has something to show. */
export const sampleNote = (content: string): NostrEvent => {
  const signed = signEvent(
    {
      kind: 1,
      created_at: FIXTURE_NOW,
      tags: [
        ["t", "nostr"],
        ["p", getPersona("bob").pubkey],
      ],
      content,
    },
    LAB_AUTHOR.secretKeyHex,
    { auxRand: new Uint8Array(32) },
  );
  // The fixture key is a compile-time constant; failing here is a programming error, so fail loud.
  if (!signed.ok) throw new Error(`chapter 03 sample: ${signed.error.message}`);
  return signed.value.event;
};

/** A real fixture reply (e + p tags) for the inspector's "load a sample" button. */
export const sampleReply = (): NostrEvent => {
  const notes = eventsByKind(1);
  const reply = notes.find((e) => e.tags.some((t) => t[0] === "e")) ?? notes[0];
  if (reply === undefined) throw new Error("chapter 03 sample: fixtures have no kind-1 events");
  return reply;
};
