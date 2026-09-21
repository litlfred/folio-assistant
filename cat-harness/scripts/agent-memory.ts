/**
 * Agent memory as graph nodes, assembled into the file the harness reads.
 *
 * @module scripts/agent-memory
 *
 * ## What this is for
 *
 * `memory: project` is a Claude Code **harness** feature: it injects the first
 * 200 lines of `.claude/agent-memory/<agent>/MEMORY.md` into a subagent's
 * system prompt. The harness decides where it looks, so that path is not ours
 * to move. What IS ours is where the entries are authored, and authoring them
 * as knowledge-graph nodes is what lets one fact reach two agents.
 *
 * The relation is the one `docs/reference/skill-instructions/` already has to
 * `memory/`: entries are authored there, scoped, and
 * **assembled** into the injected file.
 *
 * ## The generated REGION, not the generated file
 *
 * This writes only between `<!-- folio:memory:begin -->` and
 * `<!-- folio:memory:end -->`, exactly as `content/pipeline/readme-sections.ts`
 * writes only inside its markers. Nothing outside a marked region is ever
 * touched.
 *
 * That is not symmetry for its own sake. Every one of the three memory files
 * ends with a `## Session log` the agent writes as it works, and
 * `content-pipeline-navigator` also carries `## Corrected invocations`.
 * Regenerating the whole file would delete them — an agent's own running notes,
 * destroyed by the tool that exists to preserve its memory. The predecessor of
 * `readme-sections.ts` ended in `cp "$OUT" README.md` and lost an author's
 * README for the same reason.
 *
 * ## Telling a memory node from a skill
 *
 * Memory nodes lived in `skills/memory/` until 2026-09-20 — INSIDE the
 * declared `cat-harness` directory, whose path is `skills/`, and
 * `skillFiles()` in `kg-audit.ts` walks that tree recursively. So a memory
 * entry would have been audited as a skill, the same defect that made five
 * split-skill siblings appear as skills until `part-of:` was read.
 *
 * The fix was, and remains, the repo's rule: **declaration over location**. A
 * file carrying `$schema: folio-memory/v1` is a memory node whatever directory
 * it is in. #263: telling parts of a graph apart by where they sit is "a
 * coincidence of the current layout, not a contract".
 *
 * **They now have a directory of their own** — `memory/`, declared, holding the
 * `memory` graph, which is `context` by the axis bean `mhh9` settled. The
 * file-level predicate is what still does the work and is why the move was
 * safe rather than urgent: nothing depended on the directory to tell them
 * apart. What the move fixes is the OTHER direction — the containing kind was
 * `content` while its contents were `context`, and a nested declaration is the
 * defect #263 names. Bean `07xs`.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import { EMPTY_NOTE_TAGS, type KgRef, type NoteTags } from "../schemas/carried-note.js";
import { parseFrontMatter } from "../schemas/front-matter.js";
import {
  AGENT_REF_KIND,
  MEMORY_LABELS,
  MEMORY_SCHEMA_TAG,
  MemoryNodeSchema,
  memoryForAgent,
  type MemoryLabel,
  type MemoryNode,
} from "../schemas/memory.js";
import { deferResolution, directoryForGraph, repoRootFor } from "../schemas/cat-harness.js";
import { portableSegment } from "../schemas/portable-path";
// The `folio` graph kind is registered by CORE as a load-time side effect
// (`schemas/folio-graph-kind.ts`: "a layer that cannot render must not own the
// renderable kind"), and `directoriesForGraph` reads the WHOLE declaration,
// which refuses an unregistered kind. Needed here the moment this module
// started asking the declaration a question rather than composing a path —
// and it surfaced the same hour, when `main` declared a `folio` directory.
//
// The old `kgRoots` path swallowed it: `kgDirectories` wraps the read in
// try/catch and returns [] on a throw, so an unreadable declaration produced
// "no memory directories" rather than an error. That is the quieter bug of
// the two, and worth naming: this import is not a workaround for a stricter
// reader, it is what the reader was always entitled to expect.
import "../schemas/folio-graph-kind.js";

export const ROOT = resolve(import.meta.dir, "..");
/**
 * Authored entries — the directory declaring the `memory` graph.
 *
 * Asked BY GRAPH KIND rather than composed from a path. It was
 * `kgRoots(ROOT).map((d) => join(d, "memory"))` — every knowledge-graph root's
 * `memory/` subdirectory — which was the right answer while the nodes lived
 * under `skills/`, and stopped finding anything the moment they moved out:
 * `kgRoots` filters to exactly-`cat-harness`, and `memory` is its own kind now.
 *
 * `directoriesForGraph` is the question actually being asked — "where does this
 * instance keep its memory graph" — and it survives the next relocation
 * without an edit, which composing a path does not.
 */
export const MEMORY_DIRS = deferResolution(
  () => [directoryForGraph(ROOT, "memory")].filter((d): d is string => d !== undefined && existsSync(d)),
  { moduleUrl: import.meta.url, what: "its memory directories", under: ROOT },
);
// declared-path-literal: the convention fallback, so a generator in an
// instance that declares nothing still has a directory to report on.
export const MEMORY_DIR = (): string => MEMORY_DIRS()[0] ?? join(repoRootFor(ROOT), "memory");
/** Where the HARNESS looks. Not ours to move. */
export const AGENT_MEMORY_DIR = join(repoRootFor(ROOT), ".claude", "agent-memory");

export const BEGIN = "<!-- folio:memory:begin -->";
export const END = "<!-- folio:memory:end -->";

const LABELS = new Set<string>(MEMORY_LABELS);

// ── Parsing the hand-written files ──────────────────────────────

/** One `## LABEL — heading` section of a legacy `MEMORY.md`. */
export interface ParsedEntry {
  label: MemoryLabel;
  summary: string;
  comment: string;
}

/**
 * Split a hand-written `MEMORY.md` into its labelled entries.
 *
 * Only `## STABLE|TRAP|BASELINE — …` headings are entries. That is not a
 * convenience: `## Session log`, `## Corrected invocations` and the `# <agent>
 * — memory` title are all headings too, and none of them is a memory entry.
 * Keying on the label rather than on "is a heading" is what keeps them out —
 * and they are preserved in the file regardless, because this tool only ever
 * writes inside the markers.
 *
 * An em dash separates label from heading; the files use `—` throughout. A
 * hyphen is accepted too, because a heading written by hand at 2am should not
 * silently vanish from the corpus over a keystroke.
 */
export function parseMemoryFile(text: string): ParsedEntry[] {
  const out: ParsedEntry[] = [];
  const lines = text.split("\n");
  let cur: ParsedEntry | undefined;
  let body: string[] = [];

  const flush = (): void => {
    if (!cur) return;
    out.push({ ...cur, comment: body.join("\n").trim() });
    body = [];
  };

  for (const line of lines) {
    const m = /^##\s+([A-Z]+)\s+[—-]\s+(.+?)\s*$/.exec(line);
    if (m && LABELS.has(m[1]!.toLowerCase())) {
      flush();
      cur = { label: m[1]!.toLowerCase() as MemoryLabel, summary: m[2]!, comment: "" };
      continue;
    }
    // A heading that is NOT an entry ends the one in progress. Without this a
    // `## Session log` would be swallowed into the last TRAP's body and then
    // written back inside the markers, which is how the log gets destroyed by
    // a tool that never deletes anything.
    if (/^#{1,2}\s/.test(line) || line.trim() === "---") {
      flush();
      cur = undefined;
      continue;
    }
    if (cur) body.push(line);
  }
  flush();
  return out;
}

// ── Nodes on disk ───────────────────────────────────────────────

/** A slug that is stable under re-extraction, so ids do not churn. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}


/** Read every memory node under `dir`, newest-id-last. */
/** The marker separating an entry's trigger from its evidence. */
export const DETAIL_MARKER = "<!-- detail -->";

/**
 * Split a node body at {@link DETAIL_MARKER}.
 *
 * In the BODY rather than the front matter deliberately. The front-matter
 * parser here is a small hand-rolled one with no block-scalar support, and
 * detail is prose — indenting paragraphs into YAML to carry prose is how a
 * code fence or a colon later breaks a parse for no gain. An HTML comment is
 * invisible in rendered Markdown, so the source file still reads as one
 * document to a human editing it.
 *
 * No marker means the whole body is the trigger, which is the common case.
 */
export function splitDetail(body: string): { comment: string; detail?: string } {
  const i = body.indexOf(DETAIL_MARKER);
  if (i === -1) return { comment: body.trim() };
  const detail = body.slice(i + DETAIL_MARKER.length).trim();
  return { comment: body.slice(0, i).trim(), ...(detail ? { detail } : {}) };
}

/**
 * `archived` as the author wrote it, or an error naming what was not understood.
 *
 * **This refuses rather than guessing, and the asymmetry is the whole reason.**
 * The field was a string compare against `"true"`, so every other YAML spelling
 * of the same boolean was COERCED AWAY: the node came back with `archived`
 * absent, which `MemoryNodeSchema` accepts because the field is
 * `z.boolean().optional()`. `safeParse` therefore could not catch it — it never
 * saw a bad value, it saw a missing one.
 *
 * What followed is the inversion archiving exists to prevent. An archived entry
 * has typically lost its `agents` tag, so a node that fails to read as archived
 * falls through to the untagged clause and reaches EVERY agent. Measured on
 * `main` at `e94288562` with four probe nodes through this reader: of `true`,
 * `TRUE`, `True` and `yes`, three reached an agent they were never tagged for.
 *
 * The two ways to be wrong are not symmetric. Too loose and an entry the author
 * meant to keep goes missing — visible, and the agent's own work shows it. Too
 * strict, as it was, and it goes to everybody: a widened blast radius that
 * nothing reports on and no budget check counts. So an unrecognised value is an
 * error, and silencing an entry costs more than not silencing it — the same
 * reasoning `<folio:no-skill reason="…"/>` already applies.
 *
 * Bean `folio-assistant-0j8h`.
 */
const YAML_TRUE = new Set(["true", "yes", "on"]);
const YAML_FALSE = new Set(["false", "no", "off"]);

export function readArchivedFlag(raw: unknown, where: string): boolean | undefined {
  if (raw === undefined) return undefined;
  // An empty scalar parses as `[]` — the front-matter reader's marker for "key
  // with no value" — and that is an author who meant something and typed
  // nothing, not an author who meant `false`.
  if (typeof raw !== "string") {
    throw new Error(
      `${where}: \`archived\` has no value. Write \`archived: true\` to keep the node ` +
        `in the graph and out of every agent's prompt, or remove the key entirely.`,
    );
  }
  const v = raw.trim().toLowerCase();
  if (YAML_TRUE.has(v)) return true;
  if (YAML_FALSE.has(v)) return false;
  throw new Error(
    `${where}: \`archived: ${raw}\` is not a boolean this reader understands. ` +
      `Use one of ${[...YAML_TRUE].join(", ")} / ${[...YAML_FALSE].join(", ")} ` +
      `(any case). Refusing rather than guessing: a value read as "not archived" ` +
      `returns the node LIVE, and an archived entry carries no agent tag, so the ` +
      `untagged rule would hand it to every agent — the opposite of archiving.`,
  );
}

export function readMemoryNodes(dir: string = MEMORY_DIR()): MemoryNode[] {
  if (!existsSync(dir)) return [];
  const out: MemoryNode[] = [];
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith(".md")) continue;
    const path = join(dir, f);
    const { fm, body } = parseFrontMatter(readFileSync(path, "utf8"));
    // Declaration over location: a .md here without the tag is not a memory
    // node, and is left alone rather than guessed at.
    if (fm["$schema"] !== MEMORY_SCHEMA_TAG) continue;

    const agents = (Array.isArray(fm["agents"]) ? (fm["agents"] as string[]) : []).map(
      (id): KgRef => ({ kind: AGENT_REF_KIND, id }),
    );
    const tags: NoteTags = {
      ...EMPTY_NOTE_TAGS,
      roles: Array.isArray(fm["roles"]) ? (fm["roles"] as string[]) : [],
      references: agents,
    };
    const node: Record<string, unknown> = {
      ...(readArchivedFlag(fm["archived"], path) ? { archived: true } : {}),
      id: String(fm["id"] ?? basename(f, ".md")),
      summary: String(fm["summary"] ?? ""),
      comment: splitDetail(body).comment,
      createdAt: String(fm["createdAt"] ?? ""),
      label: String(fm["label"] ?? ""),
      tags,
      $schema: MEMORY_SCHEMA_TAG,
    };
    const detail = splitDetail(body).detail;
    if (detail) node["detail"] = detail;
    if (fm["measuredCommand"] !== undefined) {
      node["measured"] = {
        command: String(fm["measuredCommand"]),
        date: String(fm["measuredDate"] ?? ""),
        result: String(fm["measuredResult"] ?? ""),
      };
    }
    const parsed = MemoryNodeSchema.safeParse(node);
    if (!parsed.success) {
      throw new Error(`${path}: ${JSON.stringify(parsed.error.issues)}`);
    }
    out.push(parsed.data);
  }

  // Duplicate ids are REFUSED, not resolved. `overlayMemory` overrides by id,
  // so two nodes sharing one would leave the loser silently absent from every
  // agent's file -- a memory entry that exists on disk, passes validation, and
  // reaches nobody.
  //
  // This is not hypothetical. Both `content-pipeline-navigator` and
  // `platform-boundary-guard` carry a BASELINE titled "re-measure, do not
  // quote", and their bodies are DISJOINT: one tabulates pipeline entrypoints,
  // the other folio-specific literals and README staleness. Same title, two
  // different facts. Deriving an id from the summary would have collided them
  // and dropped one.
  const byId = new Map<string, string>();
  for (const n of out) {
    const prev = byId.get(n.id);
    if (prev !== undefined) {
      throw new Error(
        `duplicate memory id \`${n.id}\` in ${dir}: two nodes cannot share one id, ` +
          `because overlay resolves by id and the loser would reach no agent at all. ` +
          `Give them distinct ids -- a shared SUMMARY is fine and is not the same thing.`,
      );
    }
    byId.set(n.id, n.summary);
  }
  return out;
}

// ── Rendering ───────────────────────────────────────────────────

/**
 * Entries the harness will not deliver whole — by heading OR by body.
 *
 * **Heading position is the wrong question on its own, and that let a real
 * truncation through.** Measured 2026-09-19: after splitting evidence into
 * detail files the generated region ended at line 209, so the last entry's
 * body ran nine lines past the cut — and this function returned nothing,
 * because its HEADING was comfortably inside. The check was green over an
 * entry the agent receives with its conclusion missing, which is worse than a
 * dropped entry: a truncated one still looks complete.
 *
 * So a heading past the budget is reported as before, and the region ENDING
 * past the budget is reported too, naming the last entry — the one actually
 * being cut.
 */
/**
 * The build-failing half of the budget warning, separated so it can be tested.
 *
 * **A dropped ENTRY is a different failure from a long file, and only one of
 * them is worth a red build.** Overflowing into the hand-written session log
 * costs nothing — that tail was never injected. Overflowing into an entry
 * costs the agent that entry, SILENTLY: the file still reads perfectly well,
 * the harness simply truncates, and nothing says which TRAP stopped arriving.
 *
 * Measured 2026-09-19 (bean `4kiw`): adding one 70-line node took
 * `platform-boundary-guard` from 204 to 259 lines and pushed THREE TRAPs past
 * the cut, while `--check` exited 0. `entriesPastBudget` had already computed
 * the exact list; it was printed as a warning nobody had to act on.
 *
 * **This is ergonomics, not a hole — do not read it as the only guard.**
 * `scripts/tests/agent-memory.test.ts` already asserts `overflowEntries` is
 * empty for every agent, and `bun test` runs in the same CI job, so a dropped
 * TRAP was never going to reach `main`. Verified by re-creating the probe:
 * the suite fails 3 tests. What this adds is that the command named `:check`
 * fails its own check, with a message saying what to do instead of an
 * assertion diff. The first version of this comment claimed the entry could
 * drop silently, which was inferred from one command exiting 0 without
 * running the suite against the failing state.
 *
 * Deliberately NOT keyed on total line count. `platform-boundary-guard` is
 * over 200 on `main` today by a one-line session-log tail, and a gate that is
 * red for a reason nobody should act on is a gate people learn to route
 * around.
 *
 * @returns the message to print before failing, or `null` when nothing is dropped.
 */
export function droppedEntryReport(
  dropped: readonly { agent: string; entries: readonly string[] }[],
): string | null {
  // Filter rather than trust the caller's shape: an agent that is over budget
  // on its session log alone belongs in the WARNING, and a row with no dropped
  // entries reaching here would fail the build for it.
  const real = dropped.filter((d) => d.entries.length > 0);
  if (real.length === 0) return null;
  const rows = real
    .map((d) => `  ${d.agent}: ${d.entries.length} dropped — ${d.entries.join("; ")}`)
    .join("\n");
  return (
    `\nMemory entries fall past the harness's 200-line injection budget and will be\n` +
    `silently dropped before the agent ever sees them:\n\n${rows}\n\n` +
    `Shorten or split an entry, or archive one that has outlived its subject\n` +
    `(\`archived: true\` keeps the node in the graph and out of the prompt).\n` +
    `Do not fix this by letting the last entry fall off the end.`
  );
}

export function entriesPastBudget(file: string, budget = 200): string[] {
  const lines = file.split("\n");
  const isHead = (l: string): boolean => /^##\s+(STABLE|TRAP|BASELINE)\s/.test(l);
  const strip = (l: string): string => l.replace(/^##\s*/, "");

  const headingsPast = lines.slice(budget).filter(isHead).map(strip);
  if (headingsPast.length > 0) return headingsPast;

  // No heading past the cut, but the region may still end past it — in which
  // case the LAST entry is the one losing lines.
  const end = lines.findIndex((l) => l.includes(END));
  if (end === -1 || end < budget) return [];
  const lastHead = lines.slice(0, end).filter(isHead).pop();
  return lastHead ? [`${strip(lastHead)} (truncated: region ends at line ${end + 1})`] : [];
}

/** The markdown for one agent's entries — what goes between the markers. */
/**
 * Where an entry's non-injected detail is written, relative to `MEMORY.md`.
 *
 * Beside the file rather than inside it, because `MEMORY.md`'s marked region is
 * generated and its tail is the agent's own running notes — a detail file
 * written into either would be destroyed or would destroy something.
 */
export function detailRelPath(id: string): string {
  return join("detail", detailFileName(id));
}

/**
 * The detail file's basename — ONE composer, because two would prune live files.
 *
 * `writeDetail` builds a keep-set of names and deletes everything in `detail/`
 * that is not in it. So a second spelling of this name is not a cosmetic
 * duplicate: the writer would emit one name, the keep-set would hold another,
 * and the pruner would delete the file the writer had just written.
 *
 * {@link portableSegment} because a memory-entry id is an identifier and
 * nothing requires it to be a legal filename — the `req:agent-workflow` shape
 * that made this repository unclonable on Windows. Every id in use today is a
 * slug and encodes to itself, so no existing detail file moves.
 */
export function detailFileName(id: string): string {
  return `${portableSegment(id)}.md`;
}

export function renderEntries(entries: readonly MemoryNode[]): string {
  // Order is STABLE, TRAP, BASELINE: what is true, then what goes wrong, then
  // what was measured. A BASELINE last is deliberate -- it is the section most
  // likely to be cut by the harness's 200-line budget, and it is the one whose
  // staleness is designed in.
  const rank = (m: MemoryNode): number => MEMORY_LABELS.indexOf(m.label);
  const sorted = [...entries].sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));
  return sorted
    .map((m) => {
      const head = `## ${m.label.toUpperCase()} — ${m.summary}`;
      const meas = m.measured
        ? `\n\n> Measured \`${m.measured.command}\` on ${m.measured.date}: ${m.measured.result}`
        : "";
      // A pointer, not the detail itself — that is the whole point. One line
      // costs one line of budget and buys the agent a way to the evidence;
      // inlining it is what put this file at capacity.
      const more = m.detail ? `\n\nMore: \`${detailRelPath(m.id)}\`` : "";
      return `${head}\n\n${m.comment}${meas}${more}`;
    })
    .join("\n\n");
}

/**
 * Put `body` between the markers in `file`, leaving everything else alone.
 *
 * A file with no markers is **not** rewritten and not silently skipped — it
 * returns `undefined`, and the caller reports it. Writing markers into a file
 * that does not have them would mean this tool deciding where an agent's
 * generated region starts, which is the author's call.
 */
export function spliceRegion(file: string, body: string): string | undefined {
  const i = file.indexOf(BEGIN);
  const j = file.indexOf(END);
  if (i === -1 || j === -1 || j < i) return undefined;
  return `${file.slice(0, i + BEGIN.length)}\n\n${body}\n\n${file.slice(j)}`;
}

/** Agents with a memory directory the harness will read. */
export function agentNames(dir: string = AGENT_MEMORY_DIR): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export interface SyncResult {
  agent: string;
  state: "written" | "unchanged" | "no-markers" | "missing";
  entries: number;
  lines: number;
  /**
   * Memory entries that fall past the harness's 200-line injection budget.
   *
   * **Over budget is not one thing, and gating on total lines gets it wrong.**
   * The harness injects the FIRST 200 lines, so what a long file loses is its
   * TAIL — and the tail is the hand-written `## Session log`, which costs
   * nothing to drop. An entry falling past the line is a different event: that
   * is memory the agent will never see, which is the whole failure this module
   * exists to prevent.
   *
   * Measured 2026-09-19: `content-pipeline-navigator` went 13 lines over when
   * a sibling's 37-line TRAP arrived, and lost nothing but session-log lines.
   * A total-lines gate would have failed the build over that.
   */
  overflowEntries: string[];
}

/** Assemble every agent's file. `write: false` reports without touching disk. */
/**
 * Write each entry's `detail` beside `MEMORY.md`, and remove the stragglers.
 *
 * Pruning matters as much as writing: an entry whose `detail` was folded back
 * into its `comment` would otherwise leave a file behind that `MEMORY.md` no
 * longer points at, saying something the entry has stopped saying. That is the
 * orphan-sidecar shape one directory along, and it is cheap to prevent here.
 */
function writeDetail(dir: string, entries: readonly MemoryNode[]): void {
  const detailDir = join(dir, "detail");
  const wanted = new Map(entries.filter((m) => m.detail).map((m) => [detailFileName(m.id), m.detail!]));
  if (wanted.size === 0 && !existsSync(detailDir)) return;
  mkdirSync(detailDir, { recursive: true });
  for (const [name, body] of wanted) {
    writeFileSync(
      join(detailDir, name),
      `<!-- Generated from memory/${name} by \`bun run agent-memory\`. -->\n` +
        `<!-- Not injected into MEMORY.md; read on demand. Edits here are lost. -->\n\n` +
        body.trimEnd() +
        "\n",
    );
  }
  for (const f of readdirSync(detailDir)) {
    if (f.endsWith(".md") && !wanted.has(f)) rmSync(join(detailDir, f));
  }
}

export function syncAll(write: boolean): SyncResult[] {
  const nodes = readMemoryNodes();
  return agentNames().map((agent) => {
    const path = join(AGENT_MEMORY_DIR, agent, "MEMORY.md");
    if (!existsSync(path)) {
      return { agent, state: "missing", entries: 0, lines: 0, overflowEntries: [] };
    }
    const entries = memoryForAgent(nodes, agent);
    const current = readFileSync(path, "utf8");
    const next = spliceRegion(current, renderEntries(entries));
    if (next === undefined) {
      return { agent, state: "no-markers", entries: entries.length, lines: 0, overflowEntries: [] };
    }
    const lines = next.split("\n").length;
    const overflowEntries = entriesPastBudget(next);

    // The sidecars are written whether or not MEMORY.md moved, and that is a
    // FIX rather than tidiness. `writeDetail` used to sit after the
    // `unchanged` early return, so a detail block could change — or a
    // generated header could go stale — while the INJECTED comment did not,
    // and the generator reported "unchanged" over a sidecar that was not.
    // Two things an entry says, one of them checked.
    //
    // Found 2026-09-20 by the memory nodes moving (bean `07xs`): every
    // sidecar still named `skills/memory/` in its generated header, through
    // two clean runs, because both agents' MEMORY.md happened to be
    // unchanged. Exactly the case the bug hides in.
    if (write) writeDetail(dirname(path), entries);

    if (next === current) {
      return { agent, state: "unchanged", entries: entries.length, lines, overflowEntries };
    }
    if (write) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, next);
    }
    return { agent, state: "written", entries: entries.length, lines, overflowEntries };
  });
}

// ── CLI ─────────────────────────────────────────────────────────

/**
 * `bun run cat-harness/scripts/agent-memory.ts [--check]`
 *
 * `--check` writes nothing and exits non-zero when a file is stale, so CI
 * catches an entry edited in `memory/` and never assembled.
 *
 * **`no-markers` and `missing` are not failures and not passes.** A file the
 * author has not opted in is left exactly as it is and reported as such — the
 * third state this repo insists on everywhere else. Rendering "has no marked
 * region" as "up to date" would make the check green over a file it never
 * wrote, which is the shape of `docs-site.yml` failing 30 times invisibly.
 */
if (import.meta.main) {
  const check = process.argv.includes("--check");
  const results = syncAll(!check);
  let stale = 0;
  const dropped: { agent: string; entries: string[] }[] = [];
  for (const r of results) {
    const note =
      r.state === "no-markers"
        ? "no marked region — not opted in, left untouched"
        : r.state === "missing"
          ? "no MEMORY.md — nothing to assemble"
          : `${r.entries} entries, ${r.lines} lines`;
    console.log(`  ${r.state.padEnd(11)} ${r.agent.padEnd(28)} ${note}`);
    if (r.state === "written" && check) stale++;
    // The harness injects the FIRST 200 lines, so an over-long file is not an
    // error -- it still works -- but the TAIL is silently dropped. Naming what
    // falls past the line is what makes this actionable: overflowing into the
    // session log costs nothing, and overflowing into a TRAP costs the entry.
    if (r.lines > 200) {
      const detail = r.overflowEntries.length
        ? `and ${r.overflowEntries.length} MEMORY ENTRY(S) fall past it: ${r.overflowEntries.join("; ")}`
        : "and nothing past it is a memory entry — only the hand-written tail";
      console.log(
        `  ${"".padEnd(11)} ${"".padEnd(28)} ⚠ ${r.lines - 200} line(s) over the harness's 200-line budget, ${detail}`,
      );
      if (r.overflowEntries.length) dropped.push({ agent: r.agent, entries: r.overflowEntries });
    }
  }
  if (stale > 0) {
    console.error(
      `\n${stale} memory file(s) are stale. Run \`bun run agent-memory\` and commit the result.`,
    );
    process.exit(1);
  }
  const report = droppedEntryReport(dropped);
  if (check && report) {
    console.error(report);
    process.exit(1);
  }
}
