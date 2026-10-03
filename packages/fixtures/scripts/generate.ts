/**
 * Regenerates src/data/events.json deterministically from personas + the scripted story.
 * Run: bun run --cwd packages/fixtures generate
 */
import { join } from "node:path";
import { buildFixtures } from "../src/script.ts";

const out = join(import.meta.dir, "../src/data/events.json");
const { fixtureNow, events, placement } = buildFixtures();
await Bun.write(out, `${JSON.stringify({ fixtureNow, events, placement }, null, 2)}\n`);
console.log(`wrote ${events.length} events to ${out}`);
