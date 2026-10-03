/**
 * `bun run --cwd packages/nip-search definitions`: rewrites `src/data/definitions.json` from the
 * pinned corpus. Run after `snapshot:nips` or after editing DEFINITION_OVERRIDES; data.test.ts
 * fails while the committed file is stale.
 */
import { join } from "node:path";
import { definitionsFileText } from "./build.ts";

const target = join(import.meta.dir, "data", "definitions.json");
await Bun.write(target, definitionsFileText());
process.stdout.write(`wrote ${target}\n`);
