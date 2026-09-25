/**
 * The narrative review queue — bean `ju0u`.
 *
 * Agent-drafted, human-confirmed means nothing without a way for the human to
 * confirm. This is that way, and it is built around one constraint: the owner
 * has very limited hand function, so **every action is selection by number**.
 *
 * That is not a convenience. An unusable review step makes `confirmed` mean
 * "nobody got round to objecting", which is worse than not having the state:
 * it launders an unreviewed machine summary into an accepted one. If confirming
 * costs a sentence of typing, the design the owner chose is worse in practice
 * than plain agent attribution.
 *
 * So: rejection reasons are numbered too. Free text stays available through
 * `--why-text`, and is never required.
 *
 * ```sh
 * bun run narratives                 # numbered list of everything awaiting a person
 * bun run narratives:confirm 1       # accept draft 1
 * bun run narratives:reject 1 --why 2   # turn it down, reason 2 of the presets
 * bun run narratives:reject 1 --why-text "..."   # ...or say it in your own words
 * ```
 *
 * ## It never writes a draft
 *
 * This tool moves a narrative between states and records WHO did it. Writing
 * the words is an arm's job (`d5f1`, `1r0p`, `p67i`), and a tool that could
 * both draft and confirm would be one `--yes` away from the failure the whole
 * state machine exists to prevent.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { NarrativeSchema, REJECTION_REASONS, type Narrative } from "../schemas/narrative.ts";
import { SUMMARIES_FILE } from "../schemas/block-summary.ts";
import { entryItems } from "./summaries.ts";
import { directoriesForGraph } from "../schemas/cat-harness.ts";

const ROOT = resolve(import.meta.dir, "..");

/**
 * Files that may carry a `narrative` record, by the arm that writes them.
 *
 * `images.json` joined on 2026-09-20 (bean `04vl`) and is the reason
 * {@link narrativesIn} exists. The first three hold ONE narrative at the top level; that one holds
 * MANY, at `images[i].narrative`. Adding it to this list alone found nothing:
 * the queue read `doc.narrative`, which an images sidecar does not have, so it
 * reported "0 drafts" over 24 real ones and looked exactly like an empty queue.
 */
export const NARRATIVE_BEARING = [
  "tabular.jsonld",
  "contents.jsonld",
  "manifest.jsonld",
  "images.json",
  // Agent summaries of prose blocks (owner, 2026-09-24). MANY per file, at
  // `summaries[i].narrative`, like `images.json` — and like it, useless here
  // without the matching branch in {@link narrativesIn}.
  SUMMARIES_FILE,
] as const;

/** Where a narrative sits inside its document, so `decide` can write it back. */
export type NarrativePath = readonly (string | number)[];

export interface QueueItem {
  /** Repo-relative path of the file holding it. */
  file: string;
  /** The library entry's slug. */
  slug: string;
  /**
   * The narrative's location WITHIN the file — `["narrative"]` for a
   * single-narrative document, `["images", 3, "narrative"]` for an images
   * sidecar. Carried rather than recomputed so `decide` writes back to the one
   * the reviewer actually saw; with several drafts in one file, "the
   * narrative" is not a location.
   */
  path: NarrativePath;
  /** What this narrative is ABOUT, when the file holds more than one. */
  subject?: string;
  narrative: Narrative;
  /**
   * A block summary whose block's text has changed since it was drafted.
   *
   * Shown, and never confirmable: a person accepting it would be accepting a
   * summary of text that is no longer there. It goes back to the drain
   * (`bun run summaries:next`) instead.
   */
  stale?: boolean;
}

/**
 * Every narrative in one parsed document, with its path.
 *
 * Two shapes, and the second is why this is a function rather than a field
 * read. A flat document carries `narrative`; an images sidecar carries a list
 * whose entries each may. Returns `[]` for a document with neither, which is a
 * determined answer — the caller cannot tell it from "not looked" otherwise.
 */
export function narrativesIn(
  doc: Record<string, unknown>,
): { path: NarrativePath; narrative: Narrative; subject?: string }[] {
  const out: { path: NarrativePath; narrative: Narrative; subject?: string }[] = [];

  const flat = NarrativeSchema.safeParse(doc.narrative);
  if (flat.success) out.push({ path: ["narrative"], narrative: flat.data });

  const images = doc.images;
  if (Array.isArray(images)) {
    images.forEach((img, i) => {
      if (typeof img !== "object" || img === null) return;
      const rec = img as Record<string, unknown>;
      const parsed = NarrativeSchema.safeParse(rec.narrative);
      if (!parsed.success) return;
      out.push({
        path: ["images", i, "narrative"],
        narrative: parsed.data,
        // The reviewer is being asked about ONE picture among many. Without
        // this the queue shows twenty-four entries distinguishable only by
        // their text, which is the thing under review.
        subject: typeof rec.id === "string" ? rec.id : undefined,
      });
    });
  }

  // Block summaries (`summaries.json`). The subject is the block's own name,
  // so a reviewer sees WHICH section a summary is of without reading the path.
  const summaries = doc.summaries;
  if (Array.isArray(summaries)) {
    summaries.forEach((rec, i) => {
      if (typeof rec !== "object" || rec === null) return;
      const r = rec as Record<string, unknown>;
      const parsed = NarrativeSchema.safeParse(r.narrative);
      if (!parsed.success) return;
      out.push({
        path: ["summaries", i, "narrative"],
        narrative: parsed.data,
        subject: typeof r.block === "string" ? r.block.split("/").pop() : undefined,
      });
    });
  }
  return out;
}

/** Read a narrative's container so `decide` can replace exactly one. */
function setAtPath(doc: Record<string, unknown>, path: NarrativePath, value: Narrative): void {
  let cur: unknown = doc;
  for (const key of path.slice(0, -1)) {
    if (typeof cur !== "object" || cur === null) {
      throw new Error(`cannot write narrative at ${path.join(".")}: the path does not exist`);
    }
    cur = (cur as Record<string | number, unknown>)[key];
  }
  if (typeof cur !== "object" || cur === null) {
    throw new Error(`cannot write narrative at ${path.join(".")}: the path does not exist`);
  }
  (cur as Record<string | number, unknown>)[path[path.length - 1]] = value;
}

/**
 * Every narrative awaiting a person, oldest entry first.
 *
 * Only `draft` appears. A `confirmed` one is settled; a `rejected` one was
 * decided and re-offering it is exactly what the reasons exist to prevent; a
 * `not-authored` slot has nothing to look at.
 */
export function queue(root = ROOT): QueueItem[] {
  // EVERY declared library. This is a REVIEW QUEUE, and a queue that omits one
  // library shows a person a shorter list and no sign that it is short —
  // `04vl` is the bean for the last time this queue could not see 24% of what
  // it was for. `directoriesForGraph(...)[0]` until bean `a02m`.
  const libs = directoriesForGraph(root, "library").filter((d) => existsSync(d));
  if (libs.length === 0) return [];
  const out: QueueItem[] = [];
  for (const lib of libs) for (const slug of readdirSync(lib).sort()) {
    for (const name of NARRATIVE_BEARING) {
      const f = join(lib, slug, name);
      if (!existsSync(f)) continue;
      let doc: Record<string, unknown>;
      try {
        doc = JSON.parse(readFileSync(f, "utf-8")) as Record<string, unknown>;
      } catch {
        continue;
      }
      // Which summaries are stale, asked of the drain's own reader — one
      // definition of "the text changed", not a second one here.
      let stale = new Set<number>();
      if (name === SUMMARIES_FILE) {
        try {
          const status = new Map(entryItems(join(lib, slug)).map((it) => [it.block, it.status]));
          const recs = Array.isArray(doc.summaries) ? (doc.summaries as { block?: unknown }[]) : [];
          stale = new Set(recs.flatMap((r, i) => (status.get(String(r?.block)) === "stale" ? [i] : [])));
        } catch {
          // An invalid sidecar is `check:l1-complete`'s finding. Its drafts are
          // still shown; `decide` re-asks before a confirmation is written, and
          // refuses when it cannot tell.
        }
      }
      for (const { path, narrative, subject } of narrativesIn(doc)) {
        if (narrative.state !== "draft") continue;
        const isStale = path[0] === "summaries" && stale.has(path[1] as number);
        out.push({ file: relative(root, f), slug, path, subject, narrative, ...(isStale ? { stale: true } : {}) });
      }
    }
  }
  return out;
}

/**
 * Is a PERSON running this, rather than an agent shelling out?
 *
 * ## The hole this closes, found by driving the tool
 *
 * `NarrativeSchema` enforces "only a human can confirm" on the VALUE of
 * `confirmed_by.kind`. Nothing stopped whoever called `decide` from setting
 * that value. Driving the CLI in this container wrote
 *
 *     "rejected_by": { "kind": "human", "id": "Claude" }
 *
 * because `git config user.name` is `Claude` — the agent recorded ITSELF as
 * the human reviewer. That is precisely the laundering the state machine
 * exists to prevent, arriving through the tool built to serve it, and the
 * schema could not see it: a rule about who may act cannot be enforced by a
 * rule about what is written.
 *
 * A terminal is the cheapest honest signal. A person confirming at a prompt
 * has one; an agent's subprocess does not, and neither does CI.
 *
 * **This stops accident, not fraud.** An agent that set out to forge a
 * confirmation could allocate a pty or write the file directly, and nothing
 * here would notice. What it does guarantee is that no agent confirms a
 * narrative *while going about other work* — which is the failure that would
 * actually happen, repeatedly and invisibly.
 */
export function atATerminal(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

/** The human this repository belongs to, for `confirmed_by`. */
export function reviewer(opts: { interactive?: boolean } = {}): { kind: "human"; id: string } {
  if (!(opts.interactive ?? atATerminal())) {
    throw new Error(
      "refusing to record a human decision from a non-interactive shell.\n" +
        "Confirming is a PERSON's act; an agent running this would be recorded as one.\n" +
        "Run it from a terminal, or pass the reviewer explicitly if you are scripting a\n" +
        "decision a person already made.",
    );
  }
  const r = Bun.spawnSync(["git", "config", "user.name"], { cwd: ROOT });
  const name = new TextDecoder().decode(r.stdout).trim();
  if (!name) {
    // Refused rather than attributed to nobody: `confirmed_by` with an empty
    // id would satisfy the schema's `kind` check while naming no one.
    throw new Error("cannot determine who is confirming: `git config user.name` is unset");
  }
  return { kind: "human", id: name };
}

/**
 * Is this a block summary whose text has moved — or whose freshness cannot be
 * established? Asked AGAIN at decision time rather than trusted from the
 * listing, because the listing may be minutes old and a re-ingest may have
 * run in between. "Cannot tell" answers true: confirming is the one act that
 * must not happen on an unknown.
 */
function summaryNotCurrent(root: string, item: QueueItem): boolean {
  if (item.path[0] !== "summaries") return false;
  try {
    const doc = JSON.parse(readFileSync(join(root, item.file), "utf-8")) as { summaries?: { block?: unknown }[] };
    const block = doc.summaries?.[item.path[1] as number]?.block;
    const it = entryItems(dirname(join(root, item.file))).find((x) => x.block === block);
    return it?.status !== "draft";
  } catch {
    return true;
  }
}

/** Apply a decision to one queued item, writing the file. */
export function decide(
  item: QueueItem,
  outcome: "confirm" | "reject",
  opts: { reason?: string; by?: { kind: "human"; id: string }; now?: Date; root?: string } = {},
): Narrative {
  const root = opts.root ?? ROOT;
  // A stale summary is a summary of text that is no longer there. Accepting
  // it would record a person agreeing to something they were never shown.
  if (outcome === "confirm" && (item.stale || summaryNotCurrent(root, item))) {
    throw new Error(
      `refusing to confirm a STALE summary: ${item.subject ?? item.file}'s text changed after it was drafted, ` +
        "or its freshness could not be established — " +
        "it goes back to the drain (bun run summaries:next), not to a reviewer",
    );
  }
  const f = join(root, item.file);
  const doc = JSON.parse(readFileSync(f, "utf-8")) as Record<string, unknown>;
  // `opts.by` is the scripted path and is trusted BY THE CALLER — every test
  // supplies it. The CLI never does: it goes through `reviewer()`, which
  // refuses outside a terminal.
  const by = opts.by ?? reviewer();
  const at = (opts.now ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
  const next: Narrative =
    outcome === "confirm"
      ? { ...item.narrative, state: "confirmed", confirmed_by: by, confirmed_at: at }
      : {
          ...item.narrative,
          state: "rejected",
          rejected_by: by,
          rejected_at: at,
          rejection_reason: opts.reason,
        };
  // Validated BEFORE it is written. A rejection with no reason, or a
  // confirmation by a non-human, must never reach the file — a bad record on
  // disk is what the gate then has to catch, and by then it is committed.
  const r = NarrativeSchema.safeParse(next);
  if (!r.success) {
    throw new Error(`refusing to write an invalid narrative: ${r.error.issues[0]?.message ?? "invalid"}`);
  }
  // Written at the item's OWN path. `doc.narrative = …` was right while every
  // bearing file held one narrative; with 24 in a single images sidecar it
  // would have added a stray top-level record and left the draft untouched.
  setAtPath(doc, item.path, r.data);
  writeFileSync(f, JSON.stringify(doc, null, 2) + "\n", "utf-8");
  return r.data;
}

function list(items: QueueItem[]): void {
  if (items.length === 0) {
    // A determined zero, said out loud. "Nothing is waiting" and "nothing
    // looked" are different facts.
    console.log("Nothing awaiting confirmation. (0 drafts across library/.)");
    return;
  }
  console.log(`${items.length} narrative(s) awaiting you:\n`);
  items.forEach((it, i) => {
    const d = it.narrative.drafted_by;
    const who = d ? `${d.kind}${d.model ? ` ${d.model}` : ""} (${d.id})` : "unknown";
    const what = it.subject ? `${it.slug}/${it.subject}` : it.slug;
    console.log(`  [${i + 1}] ${what}  — drafted by ${who}${it.stale ? "  STALE: source changed, cannot be confirmed" : ""}`);
    console.log(`      ${it.narrative.text}`);
    console.log(`      ${it.file}\n`);
  });
  console.log("  bun run narratives:confirm <n>");
  console.log("  bun run narratives:reject <n> --why <r>     (or --why-text \"...\")\n");
  console.log("reasons:");
  REJECTION_REASONS.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const mode = argv[0];
  if (mode !== "confirm" && mode !== "reject") {
    list(queue());
    process.exit(0);
  }
  const items = queue();
  const n = Number(argv[1]);
  if (!Number.isInteger(n) || n < 1 || n > items.length) {
    console.error(`pick a number from 1 to ${items.length} — \`bun run narratives\` lists them`);
    process.exit(1);
  }
  const item = items[n - 1];
  let reason: string | undefined;
  if (mode === "reject") {
    const wi = argv.indexOf("--why");
    const wt = argv.indexOf("--why-text");
    if (wt !== -1 && argv[wt + 1]) reason = argv[wt + 1];
    else if (wi !== -1) {
      const k = Number(argv[wi + 1]);
      if (!Number.isInteger(k) || k < 1 || k > REJECTION_REASONS.length) {
        console.error(`--why takes 1..${REJECTION_REASONS.length}; see \`bun run narratives\``);
        process.exit(1);
      }
      reason = REJECTION_REASONS[k - 1];
    }
    if (!reason) {
      // Refused rather than defaulted. A rejection with no reason lets the
      // next agent redraft the identical thing.
      console.error("a rejection needs a reason: --why <n>, or --why-text \"...\"");
      process.exit(1);
    }
  }
  try {
    const out = decide(item, mode, { reason });
    console.log(`${out.state}: ${item.slug} (${item.file})`);
    if (out.rejection_reason) console.log(`  because: ${out.rejection_reason}`);
  } catch (e) {
    console.error(String(e instanceof Error ? e.message : e));
    process.exit(1);
  }
}
