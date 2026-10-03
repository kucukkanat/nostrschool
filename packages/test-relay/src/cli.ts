/**
 * Standalone relay for E2E: `bun packages/test-relay/src/cli.ts`, seeded with every fixture event.
 * Env: PORT (default 7447), HOST (default 127.0.0.1), LATENCY_MS (default 0).
 */
import { FIXTURE_EVENTS } from "@nostrschool/fixtures";
import { startTestRelay } from "./index.ts";

const intEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0)
    throw new Error(`${name} must be a non-negative integer, got "${raw}"`);
  return value;
};

const relay = await startTestRelay({
  port: intEnv("PORT", 7447),
  hostname: process.env["HOST"] || "127.0.0.1",
  latencyMs: intEnv("LATENCY_MS", 0),
  seed: FIXTURE_EVENTS,
});
console.log(`test relay listening on ${relay.url} (${relay.events().length} events)`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void relay.stop().then(() => process.exit(0));
  });
}
