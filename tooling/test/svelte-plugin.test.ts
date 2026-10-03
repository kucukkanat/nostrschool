import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import Counter from "./Counter.svelte";

afterEach(cleanup);

test("bun test compiles and renders Svelte 5 components with runes", async () => {
  const { getByTestId } = render(Counter, { props: { start: 2 } });
  const button = getByTestId("counter");
  expect(button.textContent).toBe("2:4");
  await fireEvent.click(button);
  expect(button.textContent).toBe("3:6");
});

test("Svelte runs in browser mode (client runtime, esm-env BROWSER)", async () => {
  // esm-env is Svelte's dependency, so resolve it from Svelte's own directory.
  const svelteDir = Bun.resolveSync("svelte/package.json", import.meta.dir).replace(
    /package\.json$/,
    "",
  );
  const { BROWSER, DEV } = (await import(Bun.resolveSync("esm-env", svelteDir))) as {
    BROWSER: boolean;
    DEV: boolean;
  };
  expect(BROWSER).toBe(true);
  expect(DEV).toBe(true);
});
