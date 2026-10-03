import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { plugin } from "bun";
import { sveltePlugin } from "./svelte-plugin.ts";

// A real DOM (happy-dom) instead of mocks, so Svelte components render and respond to events.
GlobalRegistrator.register({ url: "http://localhost/" });
plugin(sveltePlugin);
