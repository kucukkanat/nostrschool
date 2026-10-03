/**
 * Public props and state of @nostrschool/nip-editor. Owner: editor agent (implementation);
 * these are the contract the NIP detail page codes against.
 *
 * Every component is locale-agnostic (`locale` prop; strings from `getDictionary(locale).nips.editor`,
 * the NIP's own explanations from `getNipStrings(locale, spec.nip).text`, issue messages from
 * `.nips.issues`). `testid` is required; parts are `${testid}-<part>` as listed per prop.
 */
import type { Locale } from "@nostrschool/i18n";
import type {
  DocumentSpec,
  EncodingSpec,
  EventShape,
  FieldType,
  HttpRequestSpec,
  JsonPath,
  JsonSchemaType,
  JsonValue,
  NipSpec,
  PersonaRef,
  ProcessSpec,
  SpecPart,
  SpecPartKey,
  TagSpec,
  TextKey,
  ValidationIssue,
  ValidationReport,
  WireMessageSpec,
} from "@nostrschool/nips";
import type { ProtocolError } from "@nostrschool/protocol";

/** What the editor is editing: one part of the spec, its current JSON value and demo signer. */
export interface EditorState {
  readonly part: SpecPartKey;
  readonly value: JsonValue;
  /** Example the value started from, if any. */
  readonly example?: string;
  readonly signer?: PersonaRef;
}

export type HashError = ProtocolError<
  "no-state" | "invalid-encoding" | "invalid-json" | "unknown-part"
>;

/** Base NIP-01 event fields: the editor explains these itself when a spec has nothing to add. */
export type BuiltinField = "id" | "pubkey" | "created_at" | "kind" | "tags" | "content" | "sig";

/** A `requireOneOf` rule that applies to the selected node: any one of `tags` satisfies it. */
export interface RuleExplain {
  readonly explain: TextKey;
  readonly tags: readonly string[];
  /** The rule's tags the event has now (empty: the rule is broken). */
  readonly present: readonly string[];
}

/** What the explain panel shows for a JSON path. */
export interface ExplainTarget {
  readonly path: JsonPath;
  /** Short human locator built from spec names, e.g. ["tags", "e", "relay"]. */
  readonly breadcrumb: readonly string[];
  readonly explain?: TextKey;
  readonly field?: FieldType;
  readonly schemaType?: JsonSchemaType;
  /** The tag spec when the path is inside a tag. */
  readonly tag?: TagSpec;
  /** Validation issues at or under this path. */
  readonly issues: readonly ValidationIssue[];
  /** A base event field (explained with the editor's own NIP-01 text alongside any spec text). */
  readonly builtin?: BuiltinField;
  /** "At least one of these tags" rules for the tag list, or for a tag a rule names. */
  readonly rules?: readonly RuleExplain[];
}

/** A lint diagnostic in CodeMirror terms (character offsets into the JSON text). */
export interface JsonDiagnostic {
  readonly from: number;
  readonly to: number;
  readonly severity: "error" | "warning" | "info";
  readonly message: string;
}

export type EditorLayout = "auto" | "tabs" | "split";

/**
 * The whole editor for one NIP. Picks the variant renderer, shows the part picker, examples,
 * Form | JSON | Explain (tabs below md, side by side above), validity badge, sign button and the
 * how-it-works walkthrough. Parts: `-parts -part-<kind>-<id> -examples -example-<id> -tabs
 * -form -json -explain -validity -sign -signer -copy -share -how`.
 */
export interface NipEditorProps {
  readonly testid: string;
  readonly locale: Locale;
  readonly spec: NipSpec;
  /** Initial part (default: first part of the primary variant). Overridden by the URL hash. */
  readonly part?: SpecPartKey;
  /** Initial example id within the part (default: the first). */
  readonly example?: string;
  /** Read/write `#edit=…` so a state can be shared as a link. Default true. */
  readonly syncHash?: boolean;
  /** Default "auto" (tabs below tokens.breakpoint.md). */
  readonly layout?: EditorLayout;
  readonly onchange?: (state: EditorState) => void;
}

/** CodeMirror 6 JSON editor with lint from `diagnostics`. Parts: `-content`. */
export interface JsonCodeEditorProps {
  readonly testid: string;
  readonly locale: Locale;
  /** JSON text (bindable: edits flow back). */
  value: string;
  readonly diagnostics: readonly JsonDiagnostic[];
  /** Paths to highlight (the explain target, a walkthrough focus). */
  readonly highlight?: readonly JsonPath[];
  readonly readonly?: boolean;
  /** Caret/hover moved onto a JSON node. */
  readonly onselectpath?: (path: JsonPath) => void;
  readonly label: string;
}

/** Explanation of the selected field. Parts: `-title -body -type -issues`. */
export interface ExplainPanelProps {
  readonly testid: string;
  readonly locale: Locale;
  readonly nip: string;
  readonly target: ExplainTarget | undefined;
  /** Human locator for an issue path (e.g. "tags › e › relay"); issues elsewhere are prefixed with it. */
  readonly locate?: (path: JsonPath) => string;
  /** Jump to an issue's field: issues not at the selected path become buttons calling this. */
  readonly onselectpath?: (path: JsonPath) => void;
}

/** Step-by-step walkthrough of `spec.howItWorks` (+ process diagram for "process"). Parts: `-step-<id> -controls`. */
export interface HowItWorksProps {
  readonly testid: string;
  readonly locale: Locale;
  readonly spec: NipSpec;
  /** Bindable current step index. */
  step?: number;
  readonly onfocus?: (focus: { readonly part: SpecPartKey; readonly path?: JsonPath }) => void;
}

/** "Valid" / "N problems" badge. Parts: `-count`. */
export interface ValidityBadgeProps {
  readonly testid: string;
  readonly locale: Locale;
  readonly report: ValidationReport | undefined;
}

/** Shared by the variant forms: they edit `value` (bindable) and report the selected path. */
interface FormBase<P> {
  readonly testid: string;
  readonly locale: Locale;
  readonly nip: string;
  readonly part: P;
  value: JsonValue;
  readonly issues: readonly ValidationIssue[];
  readonly onselectpath?: ((path: JsonPath) => void) | undefined;
}

/** kind picker, created_at, content (by format), tag rows (add from template / remove / reorder), persona signer. Parts: `-kind -created-at -content -tags -tag-<i> -add-tag -add-<tagId>`. */
export type EventFormProps = FormBase<EventShape> & { signer?: PersonaRef };
/** Positional message elements; nested events/filters as sub-forms. Parts: `-element-<i>`. */
export type MessageFormProps = FormBase<WireMessageSpec>;
/** Schema-driven object form. Parts: `-field-<dotted.path>`. */
export type DocumentFormProps = FormBase<DocumentSpec>;
/** Encoding inputs ↔ encoded string, both directions, with the bech32/TLV breakdown. Parts: `-input-<name> -output -breakdown`. */
export type EncodingFormProps = FormBase<EncodingSpec>;
/** Method/URL/headers/body, with the auth event built and base64-encoded live. Parts: `-header-<name> -body -auth`. */
export type HttpFormProps = FormBase<HttpRequestSpec> & {
  readonly authEvent?: EventShape | undefined;
  /** Demo persona that signs the auth event (default "alice"). */
  readonly signer?: PersonaRef | undefined;
};

/** Actors + steps as a sequence diagram with narration. Parts: `-diagram -step-<id>`. */
export interface ProcessExplainerProps {
  readonly testid: string;
  readonly locale: Locale;
  readonly nip: string;
  readonly process: ProcessSpec;
  /** Bindable current step (-1 = start). */
  step?: number;
  /** A step that shows a spec part asks the editor to open it. */
  readonly onopenpart?: ((part: SpecPartKey) => void) | undefined;
}

export type { SpecPart };
