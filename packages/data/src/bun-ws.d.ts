/**
 * Bun ships a built-in `ws` module whose client is Bun's native WebSocket behind the `ws` API
 * (browser-style `on*` handlers included). Tests use it where happy-dom's WebSocket (installed
 * globally by the test preload) can't cope, e.g. aborting a socket that is still connecting.
 */
declare module "ws" {
  export const WebSocket: typeof globalThis.WebSocket;
}
