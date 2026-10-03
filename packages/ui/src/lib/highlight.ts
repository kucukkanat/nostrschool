/**
 * Tiny synchronous syntax tokenizer for teaching snippets. Shiki was considered, but it is async
 * (WASM + grammar loading), which Svelte SSR can't await and which bloats every island; our
 * snippets are short JSON/JS/TS/bash where a regex lexer mapped to `--color-code-*` tokens suffices.
 */
import type { CodeLanguage } from "../types.ts";

export type CodeTokenType =
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "keyword"
  | "comment"
  | "punctuation"
  | "plain";
export interface CodeToken {
  readonly type: CodeTokenType;
  readonly text: string;
}

const STR = String.raw`"(?:[^"\\\n]|\\.)*"`;
const NUM = String.raw`-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b`;
const JS_KEYWORDS = String.raw`\b(?:const|let|var|function|return|if|else|for|of|in|while|new|import|from|export|default|type|interface|await|async|class|extends|as|throw|try|catch|typeof|readonly)\b`;

const LEXERS: Readonly<Record<Exclude<CodeLanguage, "text">, RegExp>> = {
  json: new RegExp(
    String.raw`(?<key>${STR})(?=\s*:)|(?<string>${STR})|(?<number>${NUM})|(?<boolean>\b(?:true|false)\b)|(?<null>\bnull\b)|(?<punctuation>[{}[\],:])`,
    "g",
  ),
  js: jsLexer(),
  ts: jsLexer(),
  bash: new RegExp(
    String.raw`(?<comment>#.*)|(?<string>${STR}|'[^']*')|(?<key>\$\{?\w+\}?)|(?<keyword>\b(?:if|then|else|fi|for|do|done|export|echo|cd)\b)|(?<number>${NUM})|(?<punctuation>[|&;<>()])`,
    "g",
  ),
};

function jsLexer(): RegExp {
  return new RegExp(
    String.raw`(?<comment>\/\/.*|\/\*[\s\S]*?\*\/)|(?<string>${STR}|'(?:[^'\\\n]|\\.)*'|\x60(?:[^\x60\\]|\\.)*\x60)|(?<key>\b\w+\b)(?=\s*:(?!:))|(?<keyword>${JS_KEYWORDS})|(?<boolean>\b(?:true|false)\b)|(?<null>\b(?:null|undefined)\b)|(?<number>${NUM})|(?<punctuation>[{}[\]();,.:=<>+\-*/!?&|])`,
    "g",
  );
}

const tokenize = (code: string, lang: CodeLanguage): readonly CodeToken[] => {
  if (lang === "text") return [{ type: "plain", text: code }];
  const tokens: CodeToken[] = [];
  let last = 0;
  for (const m of code.matchAll(LEXERS[lang])) {
    const [type, text] = Object.entries(m.groups ?? {}).find(([, t]) => t !== undefined) ?? [];
    if (type === undefined || text === undefined) continue;
    if (m.index > last) tokens.push({ type: "plain", text: code.slice(last, m.index) });
    tokens.push({ type: type as CodeTokenType, text });
    last = m.index + text.length;
  }
  if (last < code.length) tokens.push({ type: "plain", text: code.slice(last) });
  return tokens;
};

/** Tokens grouped per line (multi-line tokens such as block comments are split at newlines). */
export const highlightLines = (
  code: string,
  lang: CodeLanguage,
): readonly (readonly CodeToken[])[] =>
  tokenize(code, lang).reduce<CodeToken[][]>(
    (lines, token) => {
      token.text.split("\n").forEach((part, i) => {
        if (i > 0) lines.push([]);
        if (part !== "") lines[lines.length - 1]?.push({ type: token.type, text: part });
      });
      return lines;
    },
    [[]],
  );
