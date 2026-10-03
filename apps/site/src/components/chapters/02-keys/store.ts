/**
 * The keypair forged in the KeyForge island, shared with the other chapter-02 islands on the page
 * (signature stamp) so the learner signs with "their" demo key. In memory only: demo keys are
 * never persisted.
 */
import type { Keypair } from "@nostrschool/protocol";
import { atom } from "nanostores";
import { sampleKeypair } from "./keys-logic.ts";

export const $demoKeypair = atom<Keypair>(sampleKeypair());
