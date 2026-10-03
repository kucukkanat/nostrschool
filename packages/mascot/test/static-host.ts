import { createServer, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * A real HTTP server for tests (no mocks). node:http rather than Bun.serve because the test
 * preload swaps the global `Response` for happy-dom's, which Bun.serve cannot send.
 */
export interface StaticHost {
  readonly url: (path: string) => string;
  readonly stop: () => Promise<void>;
}

export type Route = (res: ServerResponse) => void;

export const startStaticHost = async (
  routes: Readonly<Record<string, Route>>,
): Promise<StaticHost> => {
  const server = createServer((req, res) => {
    // happy-dom pages live on http://localhost/, so this host is cross-origin to them.
    res.setHeader("access-control-allow-origin", "*");
    if (req.method === "OPTIONS") {
      res.writeHead(204).end();
      return;
    }
    const route = routes[new URL(req.url ?? "/", "http://x").pathname];
    if (route === undefined) {
      res.writeHead(404).end("missing");
      return;
    }
    route(res);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: (path) => `http://127.0.0.1:${port}${path}`,
    stop: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
};
