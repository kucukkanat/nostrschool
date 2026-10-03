import { afterAll, expect, test } from "bun:test";
import { startStaticHost } from "../test/static-host.ts";
import {
  bindRiveInputs,
  fetchRiveAsset,
  type RiveInputLike,
  settleRiveFailure,
  settleRiveLoad,
} from "./rive.ts";

// A real HTTP server standing in for the static host.
const host = await startStaticHost({
  "/mascot/ostrich.riv": (res) =>
    res
      .writeHead(200, { "content-type": "application/octet-stream" })
      .end(Buffer.from([82, 73, 86, 69])),
  "/spa-fallback.riv": (res) =>
    res.writeHead(200, { "content-type": "text/html" }).end("<!doctype html>"),
});
afterAll(() => host.stop());
const url = host.url;

test("fetch returns the bytes of an existing .riv asset", async () => {
  const r = await fetchRiveAsset(url("/mascot/ostrich.riv"));
  expect(r.ok ? [...new Uint8Array(r.value)] : r.error).toEqual([82, 73, 86, 69]);
});

test("fetch rejects missing assets and HTML fallbacks with typed errors", async () => {
  const missing = await fetchRiveAsset(url("/missing.riv"));
  expect(missing.ok ? undefined : missing.error.code).toBe("not-found");
  const html = await fetchRiveAsset(url("/spa-fallback.riv"));
  expect(html.ok ? undefined : html.error.code).toBe("not-rive");
});

test("fetch reports unreachable hosts as network errors", async () => {
  const closed = await startStaticHost({});
  const deadUrl = closed.url("/x.riv");
  await closed.stop();
  const r = await fetchRiveAsset(deadUrl);
  expect(r.ok ? undefined : r.error.code).toBe("network");
});

// Fixture inputs with the same shape as Rive's StateMachineInput.
const input = (name: string): RiveInputLike & { fired: number } => ({
  name,
  value: 0,
  fired: 0,
  fire() {
    this.fired += 1;
  },
});

test("bindRiveInputs drives the pose number and bounce trigger", () => {
  const pose = input("pose");
  const bounce = input("bounce");
  const r = bindRiveInputs([input("other"), pose, bounce]);
  if (!r.ok) throw new Error(r.error.message);
  r.value.setPose("celebrate");
  r.value.bounce();
  expect(pose.value).toBe(5);
  expect(bounce.fired).toBe(1);
});

test("bindRiveInputs explains a file that breaks the contract", () => {
  const none = bindRiveInputs([]);
  expect(none.ok ? undefined : none.error).toEqual({
    code: "missing-input",
    message: 'State machine "Mascot" needs inputs "pose" and "bounce" (found: none)',
  });
  const partial = bindRiveInputs([input("pose")]);
  expect(partial.ok ? undefined : partial.error.message).toContain("found: pose");
});

test("settleRiveLoad binds a contract-matching file and destroys via cleanup", () => {
  let cleaned = 0;
  const pose = input("pose");
  const r = settleRiveLoad([pose, input("bounce")], () => {
    cleaned += 1;
  });
  if (!r.ok) throw new Error(r.error.message);
  r.value.setPose("panic");
  expect(pose.value).toBe(4);
  expect(cleaned).toBe(0);
  r.value.destroy();
  expect(cleaned).toBe(1);
});

test("settleRiveLoad cleans up and returns missing-input for a file that breaks the contract", () => {
  let cleaned = 0;
  const r = settleRiveLoad([input("pose")], () => {
    cleaned += 1;
  });
  expect(r.ok ? undefined : r.error.code).toBe("missing-input");
  expect(cleaned).toBe(1);
});

test("settleRiveFailure cleans up and returns a typed load-failed error", () => {
  let cleaned = 0;
  const r = settleRiveFailure("bad magic", () => {
    cleaned += 1;
  });
  expect(r.ok ? undefined : r.error).toEqual({
    code: "load-failed",
    message: "Rive failed to load the mascot file: bad magic",
  });
  expect(cleaned).toBe(1);
});
