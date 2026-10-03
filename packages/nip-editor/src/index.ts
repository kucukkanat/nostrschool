/**
 * @nostrschool/nip-editor — a spec-driven editor and explainer for every NIP. Give it a NipSpec
 * and a locale; it renders a typed form, a live CodeMirror JSON view with lint, an explain panel
 * and a how-it-works walkthrough, kept in sync both ways. Owner: editor agent.
 */
export { default as DocumentForm } from "./components/DocumentForm.svelte";
export { default as EncodingForm } from "./components/EncodingForm.svelte";
export { default as EventForm } from "./components/EventForm.svelte";
export { default as ExplainPanel } from "./components/ExplainPanel.svelte";
export { default as HowItWorks } from "./components/HowItWorks.svelte";
export { default as HttpForm } from "./components/HttpForm.svelte";
export { default as JsonCodeEditor } from "./components/JsonCodeEditor.svelte";
export { default as MessageForm } from "./components/MessageForm.svelte";
export { default as NipEditor } from "./components/NipEditor.svelte";
export { default as ProcessExplainer } from "./components/ProcessExplainer.svelte";
export { default as ValidityBadge } from "./components/ValidityBadge.svelte";
export {
  type BreakdownPart,
  decodeToInputs,
  type EncodingError,
  type EncodingInputs,
  type EncodingOutput,
  encodeInputs,
} from "./logic/encoding.ts";
export { eventFromTemplate, matchTagSpec, signDraft, tagTemplate } from "./logic/event.ts";
export { buildAuthEvent } from "./logic/http.ts";
export { type JsonNode, parseJsonNodes } from "./logic/json-locate.ts";
export { checkText, checkValue, issueMessage } from "./logic/validate.ts";
export * from "./state.ts";
export type * from "./types.ts";
