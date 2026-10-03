import { readFileSync } from "node:fs";
import { type BunPlugin, Transpiler } from "bun";
import { compile, compileModule } from "svelte/compiler";

const ts = new Transpiler({ loader: "ts" });

/**
 * Bun resolves `svelte` with node/bun export conditions, which selects Svelte's SSR entries
 * (where `mount` throws). Bun runtime plugins can't rewrite bare-specifier resolution, so we
 * swap the *contents* of each server entry for its client sibling instead. Components under
 * test therefore run the real client runtime, exactly as in the browser.
 */
const SERVER_ENTRY =
  /[\\/]node_modules[\\/]svelte[\\/]src[\\/](?:.*[\\/])?(index|legacy)-server\.js$/;
/** Svelte reads BROWSER/DEV from esm-env, which also keys off export conditions. */
const ESM_ENV = /[\\/]node_modules[\\/]esm-env[\\/]index\.js$/;

export const sveltePlugin: BunPlugin = {
  name: "svelte-test",
  setup(build) {
    build.onLoad({ filter: SERVER_ENTRY }, ({ path }) => {
      const client = path.replace(/-server\.js$/, "-client.js").replace(/^.*[\\/]/, "./");
      return { contents: `export * from ${JSON.stringify(client)};`, loader: "js" };
    });
    build.onLoad({ filter: ESM_ENV }, () => ({
      contents: "export const BROWSER = true; export const DEV = true; export const NODE = false;",
      loader: "js",
    }));
    build.onLoad({ filter: /\.svelte$/ }, ({ path }) => {
      const result = compile(readFileSync(path, "utf8"), {
        filename: path,
        generate: "client",
        dev: true,
        css: "injected",
      });
      return { contents: result.js.code, loader: "js" };
    });
    // Rune modules (`*.svelte.ts` / `*.svelte.js`) need TS stripped before Svelte compiles them.
    build.onLoad({ filter: /\.svelte\.(ts|js)$/ }, ({ path }) => {
      const source = readFileSync(path, "utf8");
      const js = path.endsWith(".ts") ? ts.transformSync(source) : source;
      const result = compileModule(js, { filename: path, generate: "client", dev: true });
      return { contents: result.js.code, loader: "js" };
    });
  },
};
