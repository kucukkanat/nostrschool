/**
 * Snapshots github.com/nostr-protocol/nips into the committed corpus the NIP reference renders.
 *
 *   bun run snapshot:nips                      # latest commit on the default branch
 *   bun run snapshot:nips -- --commit <sha>    # pin a specific commit
 *   NIPS_REPO=/path/to/local/clone bun run snapshot:nips   # offline, from a local clone
 *
 * Writes packages/nips/src/data/corpus.json (full markdown + sections, build-time only) and
 * packages/nips/src/data/index.json (metadata only, browser-safe). Parsing is pure and lives in
 * packages/nips/src/corpus/parse.ts; this file only does git and files. The site never fetches
 * NIPs at runtime. After a snapshot, new NIP ids need a spec file (`bun test packages/nips`
 * lists them) — see CONTRACTS.md "NIP reference".
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildCorpus, toIndex } from "../packages/nips/src/corpus/parse.ts";
import { isNipId, NIP_STATUSES, type NipCorpus } from "../packages/nips/src/types.ts";
import { err, ok, type Result } from "../packages/protocol/src/result.ts";

const PUBLIC_REPO = "https://github.com/nostr-protocol/nips";
const DATA_DIR = join(import.meta.dir, "../packages/nips/src/data");

interface SnapshotError {
  readonly code: "git-failed" | "no-nips";
  readonly message: string;
}

const git = (args: readonly string[], cwd?: string): Result<string, SnapshotError> => {
  const p = Bun.spawnSync(["git", ...args], {
    ...(cwd === undefined ? {} : { cwd }),
    stderr: "pipe",
  });
  return p.exitCode === 0
    ? ok(p.stdout.toString())
    : err({ code: "git-failed", message: `git ${args.join(" ")}: ${p.stderr.toString().trim()}` });
};

/** `git log --name-only --format=@%cI` → newest commit date per file (first occurrence wins). */
const lastTouched = (log: string): ReadonlyMap<string, string> => {
  const out = new Map<string, string>();
  let date = "";
  for (const line of log.split("\n")) {
    if (line.startsWith("@")) date = line.slice(1).trim();
    else if (line.trim() !== "" && !out.has(line.trim())) out.set(line.trim(), date);
  }
  return out;
};

const argValue = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i < 0 ? undefined : process.argv[i + 1];
};

/** Reads a checked-out clone (optionally moving it to `--commit`) into a corpus. */
const corpusFrom = (repo: string): Result<NipCorpus, SnapshotError> => {
  const pinned = argValue("--commit");
  const steps: readonly (() => Result<string, SnapshotError>)[] = [
    () => (pinned === undefined ? ok("") : git(["checkout", "-q", pinned], repo)),
    () => git(["rev-parse", "HEAD"], repo),
    () => git(["log", "-1", "--format=%cI", "HEAD"], repo),
    () => git(["ls-tree", "--name-only", "HEAD"], repo),
    () => git(["log", "--format=@%cI", "--name-only", "HEAD"], repo),
    () => git(["show", "HEAD:README.md"], repo),
  ];
  const outputs: string[] = [];
  for (const step of steps) {
    const r = step();
    if (!r.ok) return r;
    outputs.push(r.value);
  }
  const [, commit = "", committedAt = "", tree = "", log = "", readme = ""] = outputs;
  const touched = lastTouched(log);
  const ids = tree
    .split("\n")
    .map((f) => /^([0-9A-F]{2})\.md$/.exec(f.trim())?.[1])
    .filter(isNipId);
  if (ids.length === 0) return err({ code: "no-nips", message: "no NN.md files found" });
  const files = [];
  for (const id of ids) {
    const markdown = git(["show", `HEAD:${id}.md`], repo);
    if (!markdown.ok) return markdown;
    files.push({ id, markdown: markdown.value, updatedAt: touched.get(`${id}.md`) ?? null });
  }
  const source = {
    repo: PUBLIC_REPO,
    commit: commit.trim(),
    committedAt: committedAt.trim(),
    snapshotAt: new Date().toISOString(),
  };
  return ok(buildCorpus({ source, readme, files }));
};

const snapshot = (): Result<NipCorpus, SnapshotError> => {
  const localRepo = process.env["NIPS_REPO"];
  if (localRepo !== undefined) return corpusFrom(localRepo);
  const dir = mkdtempSync(join(tmpdir(), "nips-"));
  try {
    const repo = join(dir, "nips");
    // Blobless: full history for the per-file "updated" dates; blobs are fetched on demand.
    const cloned = git(["clone", "-q", "--filter=blob:none", PUBLIC_REPO, repo]);
    return cloned.ok ? corpusFrom(repo) : cloned;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

if (import.meta.main) {
  const result = snapshot();
  if (!result.ok) {
    console.error(`snapshot-nips: ${result.error.code}: ${result.error.message}`);
    process.exit(1);
  }
  const corpus = result.value;
  writeFileSync(join(DATA_DIR, "corpus.json"), `${JSON.stringify(corpus, null, 1)}\n`);
  writeFileSync(join(DATA_DIR, "index.json"), `${JSON.stringify(toIndex(corpus), null, 1)}\n`);
  const counts = NIP_STATUSES.map(
    (status) => `${status} ${corpus.nips.filter((n) => n.status === status).length}`,
  ).join(", ");
  console.log(
    `snapshot-nips: ${corpus.nips.length} NIPs at ${corpus.source.commit.slice(0, 12)} ` +
      `(${corpus.source.committedAt}): ${counts} → ${DATA_DIR}`,
  );
}
