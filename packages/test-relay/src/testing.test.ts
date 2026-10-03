import { expect, test } from "bun:test";
import { verifyEvent } from "@nostrschool/protocol";
import { startTestRelay } from "./index.ts";
import { connectRawClient, signTestEvent, testSecretKey } from "./testing.ts";

test("test keys and events are deterministic and really signed", () => {
  expect(testSecretKey("a")).toEqual(testSecretKey("a"));
  expect(signTestEvent("a", { kind: 1 })).toEqual(signTestEvent("a", { kind: 1 }));
  expect(verifyEvent(signTestEvent("a", { kind: 1, tags: [["t", "x"]] })).ok).toBe(true);
});

test("waitFor rejects after its timeout", async () => {
  const relay = await startTestRelay();
  const client = await connectRawClient(relay.url);
  await expect(client.waitFor(() => true, 10)).rejects.toThrow("timed out");
  client.close();
  await relay.stop();
});
