#!/usr/bin/env bun
/**
 * SUBSCRIBE an instance to an external Knowledge Graph — a **substrate** — at a
 * pinned commit: fetch ONLY the substrate's root declaration, judge it, and on
 * success record the subscription and a cached snapshot of what was judged.
 *
 * @module cat-harness/scripts/kg-subscribe
 * @covers cat-harness, substrate-snapshot
 *
 * Issue #1719, epic bean `fnx4`, slice 4 of
 * `docs/proposals/kg-subscriptions.md`. The other two verbs, materialise and
 * instantiate, are slices 5–7; this one writes the choice and the pin, and
 * nothing else arrives.
 *
 * ## What a substrate is — the rule, stated once
 *
 * A repository is a substrate at a commit when **both** hold:
 *
 * 1. **Its root carries a bootstrap declaration.** The root declaration is
 *    found by bootstrap's own rule (`declarationFileIn`: the `<stem>.json`
 *    whose `name` equals `<stem>`, and exactly one of them), and it parses as
 *    bootstrap's `KnowledgeGraphDeclarationSchema`. Nothing of this harness's
 *    schema is asked of it: a substrate need not be built on cat-harness, and
 *    every field bootstrap does not define is an Extension it may carry.
 * 2. **It declares at least one harness.** Bootstrap defines the term: *"A
 *    Knowledge Graph whose Subgraphs hold Skills, Roles or Processes."* And
 *    bootstrap names the Graph Kind for each: `skills` holds Skills,
 *    `scenarios` holds Roles, `processes` holds Processes
 *    (`BOOTSTRAP_GRAPH_KINDS`). So a declaration IS a harness when at least
 *    one of its `directories` lists one of those three kinds in `graphKinds`
 *    — {@link HARNESS_GRAPH_KINDS}, {@link harnessesOf}.
 *
 * ### Why that rule, and not the two nearer ones
 *
 * - **Not "has a `<name>.config.json`".** That is what `harness-tiles.ts`
 *   reads, and it answers a different question: whether a harness is
 *   INSTANTIATED here, in the navbar. A substrate offers harnesses to be
 *   instantiated by the subscriber (slice 7), so requiring the upstream to
 *   have instantiated its own would refuse exactly the repositories a
 *   subscription exists for.
 * - **Not this harness's own graph kinds.** A kind cat-harness registers
 *   (`methodology`, `cat-harness`, …) is an Extension to a reader that knows
 *   only bootstrap, and the owner's definition says the substrate meets
 *   BOOTSTRAP's requirements. Judging it by our vocabulary would make "is a
 *   substrate" depend on which harness is asking.
 *
 * ### Only the root is judged, and that is a limit, not a rule
 *
 * The fetch reads one file. A repository whose harnesses are all NESTED
 * instances (this monorepo's root declares only `uploads/` and `tools/`) is
 * judged not-a-substrate, and the reason names the gap. Reading one level
 * down is `knowledgeGraphsIn`'s rule and costs a blob per root directory;
 * it is recorded as an open question on the epic, not done quietly here.
 *
 * ## Three answers, never two
 *
 * - **substrate** — both points hold; the harness names are listed.
 * - **not-a-substrate(reason)** — the bytes were read and one point fails.
 * - **could-not-determine(reason)** — the bytes were NOT read: the network,
 *   the forge, a SHA the remote does not serve. Collapsing this into "not a
 *   substrate" would record a guess about a repository nobody looked at, and
 *   collapsing it into "substrate" would subscribe to one. Both are `dh4f`.
 *
 * An unpinned ref is refused BEFORE anything is fetched, with
 * `sync-remote-skills`' {@link pinnedRef}: the same reason, the same words.
 *
 * ## What is written, and where
 *
 * - The subscriber's `<instance>.json` gains (or keeps) a `subscriptions`
 *   entry: `id`, `repository`, `ref`, and NOTHING CHOSEN — every subgraph,
 *   asset and harness starts referenced. A re-subscribe at the same pin keeps
 *   whatever the subscriber has chosen since and changes no byte.
 * - A {@link SubstrateSnapshotSchema} node, `<id>.substrate.json`, in the
 *   subscriber's OWN directory declared with graph kind `substrate-snapshot`.
 *   Found through the declaration, never by a path literal; an instance that
 *   declares none is refused with what to declare. Why a wrapper rather than a
 *   copy of `<name>.json` is on the schema.
 *
 * Moving the pin of a subscription that has CHOSEN parts is refused: that is
 * `refresh-materialized` (the proposal: "Refresh is not re-subscribe"), because
 * the chosen parts' materialisation records are pinned to the old commit.
 *
 * ## `--check` — the gate over what was written
 *
 * Offline, over every instance in the checkout: each subscription has its
 * snapshot at its pin, each snapshot's digest is over its bytes and its
 * summary is what re-judging those bytes gives, every chosen part is one the
 * substrate offers, and no snapshot is orphaned ({@link checkSubscriptions}).
 * It is what JUDGES the `substrate-snapshot` kind rather than merely typing it.
 *
 * Usage:
 *   bun run kg:subscribe <owner/repo>@<40-char-sha> [--instance <dir>] [--id <id>] [--dry-run]
 *   bun run kg:subscribe:check
 */
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

import { declarationFileIn } from "../../bootstrap-tools/schemas/declaration.ts";
import { KnowledgeGraphDeclarationSchema } from "../../bootstrap-tools/schemas/graph.ts";
import {
  CatHarnessDeclarationSchema,
  KG_CONTENT_GRAPH_KINDS,
  KG_GRAPH_KIND,
  type Subscription,
  findDeclarationFile,
  instanceRootsIn,
  repoRootFor,
  siblingScopeFor,
  rootForScope,
} from "../schemas/cat-harness.js";
import { RepoFullNameSchema } from "../schemas/repo-full-name.js";
import {
  KG_PART_RECORD_SCHEMA,
  SNAPSHOT_GRAPH_KIND,
  SNAPSHOT_SUFFIX,
  SUBSTRATE_SNAPSHOT_SCHEMA,
  SubstrateSnapshotSchema,
  type SubstrateSnapshot,
} from "../schemas/substrate-snapshot.js";
import { git, pinnedRef, shallowFetch } from "./sync-remote-skills.js";

const INSTANCE = join(import.meta.dir, "..");

/** The graph kind of the directory a snapshot is written to, and a snapshot's filename suffix: defined beside the schema. */
export { SNAPSHOT_GRAPH_KIND, SNAPSHOT_SUFFIX };

/**
 * Bootstrap's Graph Kinds whose Subgraphs hold what makes a Knowledge Graph a
 * Harness: Skills, Roles (`scenarios`) and Processes. Read against
 * `BOOTSTRAP_GRAPH_KINDS`' own sentences; a test holds the two together.
 */
// The kinds split out of the `cat-harness` umbrella: knowledge-graph content
// (`kgContent`, sod4 #5) other than the umbrella itself.
export const HARNESS_GRAPH_KINDS: readonly string[] = KG_CONTENT_GRAPH_KINDS.filter((k) => k !== KG_GRAPH_KIND);

export type SubstrateVerdict =
  | {
      state: "substrate";
      file: string;
      raw: string;
      summary: SubstrateSnapshot["summary"];
    }
  | { state: "not-a-substrate"; reason: string }
  | { state: "could-not-determine"; reason: string };

/**
 * Put the substrate's ROOT `.json` files at `ref` into a directory and return
 * it. Throwing means the bytes were not read: could-not-determine. Injectable,
 * so the judgement is tested against fixtures with no network.
 */
export type RootFetcher = (repository: string, ref: string) => string | Promise<string>;

/** `owner/repo@sha`, or why not. The pin is checked with `pinnedRef`. */
export function parseTarget(arg: string): { ok: true; repository: string; ref: string } | { ok: false; why: string } {
  const at = arg.lastIndexOf("@");
  if (at <= 0) return { ok: false, why: `\`${arg}\` is not \`<owner/repo>@<40-char-sha>\`` };
  const repository = arg.slice(0, at);
  const ref = arg.slice(at + 1);
  const repo = RepoFullNameSchema.safeParse(repository);
  if (!repo.success) return { ok: false, why: `\`${repository}\`: ${repo.error.issues[0]?.message ?? "not owner/repo"}` };
  const pin = pinnedRef(ref);
  if (!pin.ok) return { ok: false, why: pin.why };
  return { ok: true, repository, ref };
}

/** The harnesses a bootstrap declaration declares, by the rule in the module docblock. */
export function harnessesOf(decl: { name: string; directories?: { graphKinds: readonly string[] }[] }): string[] {
  const isHarness = (decl.directories ?? []).some((d) => d.graphKinds.some((k) => HARNESS_GRAPH_KINDS.includes(k)));
  return isHarness ? [decl.name] : [];
}

/** Judge the `.json` files a fetcher left in `dir`. Pure over the directory. */
export function judgeRoot(dir: string): SubstrateVerdict {
  let file: string | undefined;
  try {
    file = declarationFileIn(dir);
  } catch (e) {
    return { state: "not-a-substrate", reason: e instanceof Error ? e.message.replace(dir, "the root") : String(e) };
  }
  if (!file) {
    return {
      state: "not-a-substrate",
      reason: "the root carries no Knowledge Graph declaration — no `<name>.json` whose `name` is `<name>`",
    };
  }
  return judgeDeclaration(relative(dir, file), readFileSync(file, "utf8"));
}

/**
 * Judge one root declaration's bytes — the half of {@link judgeRoot} after
 * the file is found. `--check` re-runs it over a snapshot's `raw`, so the
 * committed summary is held to the same code that wrote it.
 */
export function judgeDeclaration(name: string, raw: string): SubstrateVerdict {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { state: "not-a-substrate", reason: `\`${name}\` is not JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  const parsed = KnowledgeGraphDeclarationSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      state: "not-a-substrate",
      reason: `\`${name}\` does not meet bootstrap's declaration schema: ${issue?.path.join(".") || "(root)"}: ${issue?.message ?? parsed.error.message}`,
    };
  }
  const decl = parsed.data;
  const harnesses = harnessesOf(decl);
  if (harnesses.length === 0) {
    return {
      state: "not-a-substrate",
      reason:
        `\`${name}\` declares no harness: none of its ${(decl.directories ?? []).length} Subgraph(s) holds ` +
        `${HARNESS_GRAPH_KINDS.map((k) => `\`${k}\``).join(", ")} — bootstrap's kinds for Skills, Roles and Processes. ` +
        `Only the root declaration is read; harnesses declared by nested instances are not seen`,
    };
  }
  return {
    state: "substrate",
    file: name,
    raw,
    summary: {
      name: decl.name,
      ...(decl.title !== undefined ? { title: decl.title } : {}),
      ...(decl.version !== undefined ? { version: decl.version } : {}),
      subgraphs: (decl.directories ?? []).map((d) => ({ id: d.id, graphKinds: d.graphKinds.map(String) })),
      harnesses,
    },
  };
}

/** Fetch, then judge. A fetch that throws is could-not-determine, never either verdict. */
export async function judgeSubstrate(repository: string, ref: string, fetch: RootFetcher): Promise<SubstrateVerdict> {
  let dir: string;
  try {
    dir = await fetch(repository, ref);
  } catch (e) {
    return {
      state: "could-not-determine",
      reason: `the root declaration of ${repository} at ${ref.slice(0, 12)} was not read: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  try {
    return judgeRoot(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * The real fetcher: a shallow, BLOBLESS fetch of the one commit, then only the
 * root's `.json` blobs are read. No checkout, so a large substrate costs its
 * root tree and a few small files.
 */
export const gitRootFetcher: RootFetcher = (repository, ref) => {
  const repo = shallowFetch(`https://github.com/${repository}.git`, ref, { blobless: true, prefix: "kg-subscribe-" });
  try {
    const head = git(["rev-parse", "FETCH_HEAD"], repo).trim();
    if (head !== ref) throw new Error(`the remote served ${head} for ${ref}`);
    const out = mkdtempSync(join(tmpdir(), "kg-subscribe-root-"));
    const names = git(["ls-tree", "--name-only", "FETCH_HEAD"], repo)
      .split("\n")
      .filter((n) => n.endsWith(".json") && !n.includes("/"));
    for (const n of names) writeFileSync(join(out, n), git(["show", `FETCH_HEAD:${n}`], repo));
    return out;
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
};

// ── Writing the subscriber's declaration without reformatting it ─────────────

/**
 * The span of each TOP-LEVEL key's value in a JSON object's text. A splice
 * rather than a re-serialisation, because declarations here carry hand-chosen
 * one-line objects (`livesAt`) that `JSON.stringify` would expand, and a
 * subscribe must not rewrite lines it did not mean to touch.
 */
function topLevelValueSpans(text: string): Map<string, { start: number; end: number }> {
  const spans = new Map<string, { start: number; end: number }>();
  const ws = (ch: string | undefined): boolean => ch !== undefined && /\s/.test(ch);
  let depth = 0;
  let key: string | undefined;
  let start = -1;
  // A value ends at the comma after it at depth 1, or at the object's own closer.
  const close = (at: number): void => {
    let end = at;
    while (ws(text[end - 1])) end--;
    if (key !== undefined) spans.set(key, { start, end });
    key = undefined;
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      if (depth === 1 && key === undefined) {
        let k = j + 1;
        while (ws(text[k])) k++;
        if (text[k] === ":") {
          key = JSON.parse(text.slice(i, j + 1)) as string;
          let v = k + 1;
          while (ws(text[v])) v++;
          start = v;
          i = v - 1;
          continue;
        }
      }
      i = j;
    } else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) close(i);
    } else if (c === "," && depth === 1) close(i);
  }
  return spans;
}

/** Set a top-level key's value in a JSON object's text, 2-space indented; append the key if absent. */
export function setTopLevelKey(text: string, key: string, value: unknown): string {
  const rendered = JSON.stringify(value, null, 2).replace(/\n/g, "\n  ");
  const span = topLevelValueSpans(text).get(key);
  if (span) return text.slice(0, span.start) + rendered + text.slice(span.end);
  const close = text.lastIndexOf("}");
  let before = close;
  while (/\s/.test(text[before - 1] ?? "")) before--;
  return `${text.slice(0, before)},\n  ${JSON.stringify(key)}: ${rendered}\n${text.slice(close)}`;
}

// ── Subscribe ────────────────────────────────────────────────────────────────

export type SubscribeResult =
  | { ok: true; verdict: Extract<SubstrateVerdict, { state: "substrate" }>; entry: Subscription; changed: string[]; declarationFile: string; snapshotFile: string }
  | { ok: false; state: "refused" | "not-a-substrate" | "could-not-determine"; reason: string };

export interface SubscribeOptions {
  target: string;
  instance?: string;
  id?: string;
  dryRun?: boolean;
  fetch?: RootFetcher;
}

/** The instance's declared `substrate-snapshot` directory, resolved; `undefined` when it declares none. */
export function snapshotDirOf(instanceRoot: string, raw: Record<string, unknown>): string | undefined {
  const dirs = (raw["directories"] ?? []) as { path: string; graphKinds?: string[]; scope?: "repository" }[];
  const d = dirs.find((x) => (x.graphKinds ?? []).includes(SNAPSHOT_GRAPH_KIND));
  return d ? resolve(rootForScope(instanceRoot, d.scope), d.path) : undefined;
}

export async function subscribe(opts: SubscribeOptions): Promise<SubscribeResult> {
  const t = parseTarget(opts.target);
  if (!t.ok) return { ok: false, state: "refused", reason: t.why };

  const instanceRoot = resolve(opts.instance ?? INSTANCE);
  const declName = findDeclarationFile(instanceRoot);
  if (!declName) return { ok: false, state: "refused", reason: `${instanceRoot} carries no instance declaration to subscribe` };
  const declarationFile = join(instanceRoot, declName);
  const text = readFileSync(declarationFile, "utf8");
  const raw = JSON.parse(text) as Record<string, unknown>;

  const snapshotDir = snapshotDirOf(instanceRoot, raw);
  if (!snapshotDir) {
    return {
      ok: false,
      state: "refused",
      reason:
        `${declName} declares no directory of graph kind \`${SNAPSHOT_GRAPH_KIND}\` to cache the substrate's declaration in. ` +
        `Declare one (cat-harness's \`subscriptions\` entry is the pattern) and re-run`,
    };
  }

  const verdict = await judgeSubstrate(t.repository, t.ref, opts.fetch ?? gitRootFetcher);
  if (verdict.state !== "substrate") return { ok: false, state: verdict.state, reason: verdict.reason };

  const id = opts.id ?? verdict.summary.name;
  const existing = ((raw["subscriptions"] ?? []) as Subscription[]).slice();
  const at = existing.findIndex((s) => s.id === id);
  const prior = at >= 0 ? existing[at] : undefined;
  if (prior && prior.repository !== t.repository) {
    return {
      ok: false,
      state: "refused",
      reason: `subscription \`${id}\` already names ${prior.repository}; pass \`--id\` to subscribe ${t.repository} under another name`,
    };
  }
  if (prior && prior.ref !== t.ref && (prior.subgraphs?.length || prior.harnesses?.length || (prior.assets && prior.assets.policy !== "none"))) {
    return {
      ok: false,
      state: "refused",
      reason:
        `subscription \`${id}\` is pinned at ${prior.ref.slice(0, 12)} and has chosen parts, whose materialisation records are pinned there too. ` +
        `Moving the pin is \`refresh-materialized\`, not a re-subscribe`,
    };
  }
  // Nothing chosen on a first subscribe; a re-subscribe keeps every choice.
  const entry: Subscription = prior ? { ...prior, ref: t.ref } : { id, repository: t.repository, ref: t.ref };
  if (at >= 0) existing[at] = entry;
  else existing.push(entry);

  const nextRaw = { ...raw, subscriptions: existing };
  const check = CatHarnessDeclarationSchema.safeParse(
    Object.fromEntries(Object.entries(nextRaw).filter(([k]) => !k.startsWith("@"))),
  );
  if (!check.success) {
    const issue = check.error.issues[0];
    return { ok: false, state: "refused", reason: `the declaration would not parse: ${issue?.path.join(".")}: ${issue?.message}` };
  }

  const snapshot: SubstrateSnapshot = SubstrateSnapshotSchema.parse({
    $schema: SUBSTRATE_SNAPSHOT_SCHEMA,
    subscription: id,
    repository: t.repository,
    ref: t.ref,
    file: verdict.file,
    raw: verdict.raw,
    fixity: { algorithm: "sha256", digest: createHash("sha256").update(verdict.raw).digest("hex") },
    summary: verdict.summary,
    note: "Somebody else's bytes, pinned. Do not edit: re-run `bun run kg:subscribe` at the pin, or refresh.",
  });
  const snapshotFile = join(snapshotDir, `${id}.substrate.json`);
  const snapshotText = `${JSON.stringify(snapshot, null, 2)}\n`;
  const nextText = prior && prior.ref === t.ref ? text : setTopLevelKey(text, "subscriptions", existing);

  const changed: string[] = [];
  if (nextText !== text) changed.push(declarationFile);
  if (!existsSync(snapshotFile) || readFileSync(snapshotFile, "utf8") !== snapshotText) changed.push(snapshotFile);
  if (!opts.dryRun) {
    if (nextText !== text) writeFileSync(declarationFile, nextText);
    if (changed.includes(snapshotFile)) {
      mkdirSync(snapshotDir, { recursive: true });
      writeFileSync(snapshotFile, snapshotText);
    }
  }
  return { ok: true, verdict, entry, changed, declarationFile, snapshotFile };
}

// ── --check: offline, every subscription has a snapshot that still holds ────


/**
 * Offline judgement of one instance's subscriptions and snapshots. Findings,
 * each a sentence; `[]` is clean. What it holds:
 *
 * - every `subscriptions` entry has its snapshot, at the entry's repository
 *   and pin, and the instance declares somewhere to keep it;
 * - each snapshot parses, its digest is over its `raw`, and re-judging `raw`
 *   gives the committed `summary` — so a hand edit to either is caught;
 * - every CHOSEN subgraph and harness is one the substrate offers;
 * - no snapshot is orphaned: each belongs to a subscription.
 */
export function checkSubscriptions(instanceRoot: string): string[] {
  const declName = findDeclarationFile(instanceRoot);
  if (!declName) return [];
  const raw = JSON.parse(readFileSync(join(instanceRoot, declName), "utf8")) as Record<string, unknown>;
  const subs = (raw["subscriptions"] ?? []) as Subscription[];
  const dir = snapshotDirOf(instanceRoot, raw);
  const out: string[] = [];
  if (!dir) {
    if (subs.length) out.push(`${declName}: ${subs.length} subscription(s) and no \`${SNAPSHOT_GRAPH_KIND}\` directory to hold their snapshots`);
    return out;
  }
  const seen = new Set<string>();
  for (const s of subs) {
    const file = join(dir, `${s.id}${SNAPSHOT_SUFFIX}`);
    seen.add(`${s.id}${SNAPSHOT_SUFFIX}`);
    if (!existsSync(file)) {
      out.push(`${s.id}: no snapshot at ${relative(instanceRoot, file)} — run \`bun run kg:subscribe ${s.repository}@${s.ref}\``);
      continue;
    }
    const parsed = SubstrateSnapshotSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
    if (!parsed.success) {
      out.push(`${s.id}: the snapshot does not parse: ${parsed.error.issues[0]?.path.join(".")}: ${parsed.error.issues[0]?.message}`);
      continue;
    }
    const snap = parsed.data;
    if (snap.subscription !== s.id) out.push(`${s.id}: the snapshot says it belongs to \`${snap.subscription}\``);
    if (snap.repository !== s.repository || snap.ref !== s.ref) {
      out.push(`${s.id}: the snapshot is of ${snap.repository}@${snap.ref.slice(0, 12)}, the subscription pins ${s.repository}@${s.ref.slice(0, 12)} — re-subscribe`);
    }
    if (createHash("sha256").update(snap.raw).digest("hex") !== snap.fixity.digest) {
      out.push(`${s.id}: the snapshot's bytes do not match their digest — somebody else's bytes were edited in place`);
    }
    const again = judgeDeclaration(snap.file, snap.raw);
    if (again.state !== "substrate") out.push(`${s.id}: the cached declaration no longer judges as a substrate: ${again.reason}`);
    else if (JSON.stringify(again.summary) !== JSON.stringify(snap.summary)) out.push(`${s.id}: the snapshot's summary is not what its bytes say`);
    const offered = new Set(snap.summary.subgraphs.map((g) => g.id));
    for (const g of s.subgraphs ?? []) if (!offered.has(g)) out.push(`${s.id}: chose subgraph \`${g}\`, which the substrate does not declare`);
    for (const h of s.harnesses ?? []) if (!snap.summary.harnesses.includes(h)) out.push(`${s.id}: chose harness \`${h}\`, which the substrate does not declare`);
  }
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((n) => n.endsWith(SNAPSHOT_SUFFIX)).sort()) {
      if (!seen.has(f)) out.push(`${relative(instanceRoot, join(dir, f))}: a snapshot no subscription names — orphaned`);
    }
  }
  return out;
}

// ── Materialised parts: the layout the writer and every reader share ─────────

/**
 * Slices 5 and 6 copy a CHOSEN subgraph, or one asset, of a subscribed
 * substrate into the subscriber. The writer is
 * `folio-assistant-core/scripts/kg-materialize.ts`, and it lives in core
 * rather than here for one reason: its record embeds core's
 * `MaterializationSchema`, and this instance needs only bootstrap, so a
 * writer here would import up the dependency arrow (`check:partition`).
 *
 * What lives HERE is what the readers below core need without importing up:
 * where a part's bytes and record sit, how a tree is digested, and a
 * STRUCTURAL view of a record that the subscriptions page draws from. One
 * layout, stated once, read by the writer, its `--check`, that page and
 * `check:materialized-fixity`.
 *
 * ## The layout
 *
 * Under the subscriber's own `substrate-snapshot` directory — the same place
 * the snapshot is cached, because a materialised part is the same layer:
 * somebody else's bytes at the pin, written by a command, never by hand.
 *
 * ```text
 * <snapshot dir>/<subscription>/subgraphs/<subgraph id>/materialization.json
 * <snapshot dir>/<subscription>/subgraphs/<subgraph id>/tree/…      the upstream directory's contents
 * <snapshot dir>/<subscription>/assets/<upstream path>/materialization.json
 * <snapshot dir>/<subscription>/assets/<upstream path>/tree/<file>
 * <snapshot dir>/<subscription>/nodes/<subgraph path>/nodes.json
 * <snapshot dir>/<subscription>/nodes/<subgraph path>/index.hydrated.jsonld
 * ```
 *
 * `nodes/` is the METADATA mode (`kg:materialize --nodes`, bean `c1m4`): the
 * subgraph's published `index.hydrated.jsonld` and a `nodes.json` record with
 * its sha256 — graph metadata, no bytes of the subgraph itself. No `tree/`,
 * because the part is one file and the record never hashes itself; and the
 * directory nests (`nodes/skills/` may hold `nodes/skills/sdlc/`), because a
 * subgraph path is a path, so a fetch of a parent never disturbs a child.
 *
 * The bytes sit under `tree/`, apart from the record, so a digest over the
 * tree never has to exclude the record that carries it, and so a scanner can
 * be told "do not read upstream's own files as ours" with one directory name
 * (`check:materialized-fixity` honours it: upstream's materialization records
 * describe upstream's checkout, not this one).
 */
export const PART_RECORD_FILE = "materialization.json";
export const PART_TREE = "tree";

export type KgPart = { kind: "subgraph"; id: string; path: string } | { kind: "asset"; path: string };

/** The metadata-mode record beside a fetched `index.hydrated.jsonld`. */
export const NODES_RECORD_FILE = "nodes.json";
export const NODES_DIR = "nodes";

/** Where one subgraph's metadata-mode record and `index.hydrated.jsonld` live. */
export function nodesDirOf(snapshotDir: string, subscription: string, subgraphPath: string): string {
  return join(snapshotDir, subscription, NODES_DIR, ...subgraphPath.split("/").filter(Boolean));
}

/** Where a part's record and `tree/` live. */
export function partDirOf(
  snapshotDir: string,
  subscription: string,
  part: { kind: "subgraph"; id: string } | { kind: "asset"; path: string },
): string {
  return part.kind === "subgraph"
    ? join(snapshotDir, subscription, "subgraphs", part.id)
    : join(snapshotDir, subscription, "assets", ...part.path.split("/"));
}

/**
 * A repository-relative POSIX path that stays where it is joined, or why not.
 * No absolute path, no `..`, no empty or dot-prefixed segment — the last is
 * the dot-prefix guard every declared path here already meets.
 */
export function safeRelPath(p: string): { ok: true; path: string } | { ok: false; why: string } {
  const path = p.replace(/\/+$/, "");
  if (!path) return { ok: false, why: "an empty path names the whole repository, not a part of it" };
  if (path.startsWith("/") || path.includes("\\") || /^[A-Za-z]:/.test(path)) {
    return { ok: false, why: `\`${p}\` is not a repository-relative POSIX path` };
  }
  for (const s of path.split("/")) {
    if (s === "" || s === "." || s === "..") return { ok: false, why: `\`${p}\` has a \`${s || "//"}\` segment` };
    if (s.startsWith(".")) return { ok: false, why: `\`${p}\` has a dot-prefixed segment \`${s}\`` };
  }
  return { ok: true, path };
}

/** Every file under `dir`, relative and sorted; symbolic links reported apart, never followed. */
export function treeEntries(dir: string): { files: string[]; links: string[] } {
  const files: string[] = [];
  const links: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      const rel = relative(dir, p).split("\\").join("/");
      if (e.isSymbolicLink()) links.push(rel);
      else if (e.isDirectory()) walk(p);
      else if (e.isFile()) files.push(rel);
    }
  };
  if (existsSync(dir)) walk(dir);
  return { files: files.sort(), links: links.sort() };
}

export const sha256File = (p: string): string => createHash("sha256").update(readFileSync(p)).digest("hex");

/**
 * One digest over a whole tree: sha256 of the `sha256sum` listing of its
 * files — `<digest>  <relative path>\n`, sorted by path. It moves when a byte
 * changes and when a file is added, removed or renamed, which is what lets a
 * single `fixity` on a directory record mean something. Empty directories are
 * not content (git holds none).
 */
export function treeDigest(dir: string, files: readonly string[] = treeEntries(dir).files): string {
  const listing = files.map((f) => `${sha256File(join(dir, f))}  ${f}\n`).join("");
  return createHash("sha256").update(listing).digest("hex");
}

/**
 * A STRUCTURAL view of one part record — enough to draw it, and to say
 * whether its bytes still hash to what it records. It reads fields and parses
 * nothing against core's schema; that is the writer's `--check`. A record it
 * cannot read is `unreadable`, never skipped.
 */
export interface PartView {
  /** The part's directory, absolute. */
  dir: string;
  /**
   * Which part the LAYOUT says this directory holds. Known even when the
   * record is unreadable, so a broken record is drawn on its part's row
   * instead of falling off the page.
   */
  slot: { kind: "subgraph"; id: string } | { kind: "asset"; path: string };
  /** Which part the RECORD says it is; the writer's `--check` holds the two equal. */
  part?: KgPart;
  ref?: string;
  state: "materialized" | "referenced" | "unreadable";
  /** Why it is unreadable. */
  why?: string;
  /** For a part that stayed referenced: the gates that came back `refused`, and those not answered. */
  refused: string[];
  unanswered: string[];
  /** For a part that stayed referenced: no purpose was stated, so no gate could be judged. */
  purposeMissing?: boolean;
  purpose?: string;
  bytes?: number;
  fileCount?: number;
  /** A held part only: whether the bytes under `tree/` still hash to the record. */
  fixity?: "verified" | "mismatch" | "absent";
}

function viewOf(dir: string, slot: PartView["slot"]): PartView {
  const base: PartView = { dir, slot, state: "unreadable", refused: [], unanswered: [] };
  let r: Record<string, unknown>;
  try {
    r = JSON.parse(readFileSync(join(dir, PART_RECORD_FILE), "utf8")) as Record<string, unknown>;
  } catch (e) {
    return { ...base, why: `not readable as JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (r["$schema"] !== KG_PART_RECORD_SCHEMA) return { ...base, why: `not a \`${KG_PART_RECORD_SCHEMA}\` record` };
  const m = (r["materialization"] ?? {}) as Record<string, unknown>;
  const part = r["part"] as KgPart | undefined;
  const view: PartView = {
    ...base,
    ...(part ? { part } : {}),
    ...(typeof r["ref"] === "string" ? { ref: r["ref"] } : {}),
    ...(typeof m["purpose"] === "string" ? { purpose: m["purpose"] } : {}),
    ...(typeof m["bytes"] === "number" ? { bytes: m["bytes"] } : {}),
  };
  if (m["state"] === "referenced") {
    const refusal = (r["refusal"] ?? {}) as Record<string, unknown>;
    const gates = (refusal["gates"] ?? {}) as Record<string, { verdict?: string }>;
    return {
      ...view,
      state: "referenced",
      ...(refusal["purposeMissing"] === true ? { purposeMissing: true } : {}),
      refused: Object.keys(gates).filter((k) => gates[k]?.verdict === "refused").sort(),
      unanswered: Object.keys(gates).filter((k) => gates[k]?.verdict !== "refused" && gates[k]?.verdict !== "permitted").sort(),
    };
  }
  if (m["state"] !== "materialized") return { ...view, why: `state \`${String(m["state"])}\` is neither held nor referenced` };
  const tree = join(dir, PART_TREE);
  const { files } = treeEntries(tree);
  const want = ((m["fixity"] ?? {}) as { digest?: unknown }).digest;
  let fixity: PartView["fixity"];
  if (files.length === 0) fixity = "absent";
  else if (part?.kind === "asset") fixity = files.length === 1 && sha256File(join(tree, files[0]!)) === want ? "verified" : "mismatch";
  else fixity = treeDigest(tree, files) === want ? "verified" : "mismatch";
  return { ...view, state: "materialized", fileCount: files.length, fixity };
}

/**
 * Every part record under one subscription's directory, and every STRAY: a
 * file, or a part directory with no record — bytes nobody accounts for.
 * `strays` are relative to the snapshot directory.
 */
export function partRecordsIn(snapshotDir: string, subscription: string): { parts: PartView[]; strays: string[]; nodes: string[] } {
  const base = join(snapshotDir, subscription);
  const parts: PartView[] = [];
  const strays: string[] = [];
  const nodes: string[] = [];
  if (!existsSync(base)) return { parts, strays, nodes };
  const rel = (p: string): string => relative(snapshotDir, p).split("\\").join("/");
  for (const e of readdirSync(base, { withFileTypes: true })) {
    const p = join(base, e.name);
    if (e.name === "subgraphs" && e.isDirectory()) {
      for (const g of readdirSync(p, { withFileTypes: true })) {
        const gd = join(p, g.name);
        if (g.isDirectory() && existsSync(join(gd, PART_RECORD_FILE))) parts.push(viewOf(gd, { kind: "subgraph", id: g.name }));
        else strays.push(rel(gd));
      }
    } else if (e.name === "assets" && e.isDirectory()) {
      const walk = (d: string): void => {
        for (const a of readdirSync(d, { withFileTypes: true })) {
          const ad = join(d, a.name);
          if (a.isDirectory() && !lstatSync(ad).isSymbolicLink()) {
            if (existsSync(join(ad, PART_RECORD_FILE))) parts.push(viewOf(ad, { kind: "asset", path: relative(p, ad).split("\\").join("/") }));
            else walk(ad);
          } else strays.push(rel(ad));
        }
      };
      walk(p);
    } else if (e.name === NODES_DIR && e.isDirectory()) {
      // Metadata mode: a directory holding `nodes.json` is one fetched
      // subgraph, and it may also hold a child's directory. The only files a
      // record accounts for are itself and the hydrated file beside it.
      const walk = (d: string): void => {
        const recorded = existsSync(join(d, NODES_RECORD_FILE));
        if (recorded) nodes.push(d);
        for (const a of readdirSync(d, { withFileTypes: true })) {
          const ad = join(d, a.name);
          if (a.isDirectory() && !lstatSync(ad).isSymbolicLink()) walk(ad);
          else if (!(recorded && (a.name === NODES_RECORD_FILE || a.name === "index.hydrated.jsonld"))) strays.push(rel(ad));
        }
      };
      walk(p);
    } else strays.push(rel(p));
  }
  return { parts: parts.sort((a, b) => a.dir.localeCompare(b.dir)), strays: strays.sort(), nodes: nodes.sort() };
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes("--check")) {
    const roots = [...new Set([resolve(INSTANCE), ...instanceRootsIn(siblingScopeFor(INSTANCE)).map((r) => resolve(r))])];
    let subs = 0;
    const problems: string[] = [];
    for (const r of roots) {
      const f = findDeclarationFile(r);
      if (!f) continue;
      subs += ((JSON.parse(readFileSync(join(r, f), "utf8")) as { subscriptions?: unknown[] }).subscriptions ?? []).length;
      problems.push(...checkSubscriptions(r).map((p) => `${relative(repoRootFor(INSTANCE), r) || "."}: ${p}`));
    }
    console.log(`KG subscriptions — ${subs} across ${roots.length} instance(s)`);
    for (const p of problems) console.error(`  ✗ ${p}`);
    if (problems.length) process.exit(1);
    console.log(subs ? "  ✓ every subscription has a snapshot at its pin, and each snapshot holds" : "  ✓ none subscribed — every declaration was read, and no snapshot is orphaned");
    process.exit(0);
  }
  const target = argv.find((a, i) => !a.startsWith("--") && !["--instance", "--id"].includes(argv[i - 1] ?? ""));
  if (!target) {
    console.error("usage: bun run kg:subscribe <owner/repo>@<40-char-sha> [--instance <dir>] [--id <id>] [--dry-run]");
    process.exit(2);
  }
  const dryRun = argv.includes("--dry-run");
  const r = await subscribe({ target, instance: flag(argv, "--instance"), id: flag(argv, "--id"), dryRun });
  if (!r.ok) {
    const mark = r.state === "could-not-determine" ? "?" : "✗";
    console.error(`  ${mark} ${r.state}: ${r.reason}`);
    process.exit(r.state === "could-not-determine" ? 3 : 1);
  }
  console.log(`  ✓ substrate: ${r.verdict.summary.name} — harness(es) ${r.verdict.summary.harnesses.join(", ")}, ${r.verdict.summary.subgraphs.length} subgraph(s), all referenced`);
  if (r.changed.length === 0) console.log("  ✓ already subscribed at this pin — nothing to write");
  for (const f of r.changed) console.log(`  ${dryRun ? "would write" : "wrote"} ${relative(process.cwd(), f)}`);
}
