/**
 * Is the source of a staged layer settled enough to seed it?
 *
 * ```sh
 * bun run seed:ready --layer cat-harness           # JSON report, exit 0/1/2
 * bun run seed:ready --layer cat-harness --text    # the same, for a person
 * bun run seed:ready --layer cat-harness --fixture prs.json   # offline
 * ```
 *
 * This evaluates `GW_Settled` — "Source settled?" — in
 * `processes/kg-separation.bpmn`, the gateway in front of `10 · Seed`. The
 * decision itself is `processes/decisions/seed-readiness-gate.dmn`; this
 * script gathers the facts and hands them to the table, so **every threshold
 * lives in the table and none lives here**. Change the table, not this file.
 *
 * ## Why a seed waits for the source to settle
 *
 * A seed is a snapshot: one commit, no history (bean `iai8`). Every open PR
 * whose diff touches the layer at that moment is orphaned into the monorepo —
 * its change is in neither the seed nor, after cutover, anywhere that reads
 * it. The steward was applying four criteria by hand before each seeding
 * review (2026-10-02); this is those criteria, generalised per layer and read
 * off the declarations rather than off a list of directory names:
 *
 * | fact               | what is counted                                              |
 * |--------------------|--------------------------------------------------------------|
 * | `heavyMoversOpen`  | open PRs labelled `heavy-mover` that touch L or the next layer |
 * | `nextLayerPrs`     | open PRs touching the NEXT layer (L+1)                       |
 * | `layerPrs`         | open PRs touching L                                          |
 * | `layerMovingPrs`   | open PRs that rename or delete a file in L, or rename one in |
 * | `undetermined`     | criteria this run could not decide                           |
 *
 * ## The layer map is derived, never written here
 *
 * A layer is an instance declaration whose `livesAt` says it is staged in a
 * repository. Its directory is `livesAt.path`; its position is the longest
 * `needs` chain beneath it, so `bootstrap → bootstrap-tools → cat-harness →
 * cat-harness-tools → folio-assistant-core → {sci, fhir-harness, who-iris}`
 * falls out of the declarations rather than being restated. "The next layer"
 * is every instance one level up that needs L, directly or transitively. The
 * repository whose PRs are read is `livesAt.repository` — where the layer's
 * in-flight work actually is.
 *
 * ## Could-not-determine is never green
 *
 * GitHub's files endpoint stops at 3,000 files, so a PR larger than that has a
 * path set this script cannot see whole. A criterion that depends on the
 * unseen part is `could-not-determine`, and the gate answers `unknown` rather
 * than `settled`. A missing `heavy-mover` label is the same: it means the
 * marker does not exist, not that nothing carries it. An unknown can only
 * withhold `settled`; it never hides a certain `not yet`, which is why the
 * table tests the findings first.
 *
 * ## It reports and never acts
 *
 * Nothing here seeds, pushes, labels or comments. Seeding is `10 · Seed`, after
 * the owner's authorisation (`9 · Authorise`, bean `smbc`).
 *
 * @module cat-harness/scripts/seed-ready
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { instanceRootsIn, readDeclaration, repoRootFor } from "../schemas/cat-harness.js";
import { evaluate, loadDecisionTable, type DecisionTable } from "../src/workflow/decision-table.js";

/** The decision table this script evaluates. */
export const SEED_READINESS_DMN = resolve(import.meta.dir, "../processes/decisions/seed-readiness-gate.dmn");
export const SEED_READINESS_DECISION = "Decision_SeedReadiness";

/** The PR label that marks a heavy mover. One label, one place. */
export const HEAVY_MOVER_LABEL = "heavy-mover";

/** GitHub's `pulls/{n}/files` endpoint returns at most this many files. */
export const GITHUB_FILES_CAP = 3000;

// ─── the layer map ──────────────────────────────────────────────────────────

/** One instance declaration, reduced to what the layer map needs. */
export interface LayerDecl {
  name: string;
  /** Repository-relative directory: `livesAt.path`, or where the declaration sits. */
  dir: string;
  needs: string[];
  /** `livesAt.repository` — present only for a layer staged in another repo. */
  stagedIn?: string;
}

/**
 * Read every instance declaration in the checkout.
 *
 * The aggregate at the repository root is left out: its directory is the
 * whole checkout, so it would "touch" every PR, and it is not a layer anybody
 * seeds.
 */
export function readLayers(repoRoot: string): LayerDecl[] {
  const root = resolve(repoRoot);
  const out: LayerDecl[] = [];
  for (const at of instanceRootsIn(root)) {
    if (resolve(at) === root) continue;
    const d = readDeclaration(at);
    if (!d?.name) continue;
    out.push({
      name: d.name,
      dir: d.livesAt?.path ?? relative(root, at),
      needs: d.needs ?? [],
      stagedIn: d.livesAt?.repository,
    });
  }
  return out;
}

export interface LayerPlan {
  layer: LayerDecl;
  /** Longest `needs` chain beneath the layer; the foundation is 0. */
  depth: number;
  /** Instances one level up that need this layer, directly or transitively. */
  next: LayerDecl[];
}

/**
 * Place a layer in the stack. Throws on an unknown name or a cycle — both are
 * declaration defects that `check:instance-graph` owns, and a readiness answer
 * computed over a broken map would be an answer about some other stack.
 */
export function planLayer(decls: LayerDecl[], name: string): LayerPlan {
  const byName = new Map(decls.map((d) => [d.name, d]));
  const layer = byName.get(name);
  if (!layer) {
    throw new Error(
      `no instance declaration names \`${name}\`. Declared: ${decls
        .map((d) => d.name)
        .sort()
        .join(", ")}`,
    );
  }

  const depthMemo = new Map<string, number>();
  const depth = (n: string, path: string[] = []): number => {
    const hit = depthMemo.get(n);
    if (hit !== undefined) return hit;
    if (path.includes(n)) throw new Error(`\`needs\` cycle: ${[...path, n].join(" → ")}`);
    // A need that names no declaration here is outside this checkout; it is
    // below everything in it, so it contributes depth 0 rather than vanishing.
    const needs = (byName.get(n)?.needs ?? []).filter((x) => byName.has(x));
    const d = needs.length === 0 ? 0 : 1 + Math.max(...needs.map((x) => depth(x, [...path, n])));
    depthMemo.set(n, d);
    return d;
  };

  const needsTransitively = (from: string, target: string, seen = new Set<string>()): boolean => {
    for (const x of byName.get(from)?.needs ?? []) {
      if (x === target) return true;
      if (seen.has(x)) continue;
      seen.add(x);
      if (needsTransitively(x, target, seen)) return true;
    }
    return false;
  };

  const d = depth(name);
  const next = decls
    .filter((o) => o.name !== name && depth(o.name) === d + 1 && needsTransitively(o.name, name))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { layer, depth: d, next };
}

// ─── open PRs as path sets ──────────────────────────────────────────────────

/** One changed file, as GitHub's `pulls/{n}/files` reports it. */
export interface PrFile {
  path: string;
  /** `added`, `modified`, `removed`, `renamed`, `copied`, `changed`, `unchanged`. */
  status: string;
  /** For `renamed`: where the file was. */
  previousPath?: string;
}

/**
 * An open PR and the paths it changes. `changedFiles` is GitHub's own count;
 * when `files` is shorter, the path set is incomplete and every answer that
 * depends on the unseen part is "could not determine".
 */
export interface PrPathSet {
  number: number;
  title: string;
  draft: boolean;
  labels: string[];
  changedFiles: number;
  files: PrFile[];
}

/** What a run read from the forge, or from a fixture with the same shape. */
export interface ForgeSnapshot {
  repository: string;
  /** Whether the `heavy-mover` label exists; `undefined` when that could not be asked. */
  heavyMoverLabelExists: boolean | undefined;
  /** `undefined` when the open PRs could not be listed at all. */
  prs: PrPathSet[] | undefined;
  /** Why something could not be read, for the report. */
  errors: string[];
}

function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf-8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}

/** JSON-lines output of a paginated `gh api --jq '.[] | …'`. */
function ghLines<T>(path: string, jq: string): T[] {
  return gh(["api", "--paginate", path, "--jq", jq])
    .split("\n")
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l) as T);
}

/** Read the open PRs of `repository` through the `gh` CLI. Never throws. */
export function fetchForge(repository: string): ForgeSnapshot {
  const errors: string[] = [];

  let heavyMoverLabelExists: boolean | undefined;
  try {
    gh(["api", `repos/${repository}/labels/${HEAVY_MOVER_LABEL}`, "--jq", ".name"]);
    heavyMoverLabelExists = true;
  } catch (e) {
    const msg = e instanceof Error ? String((e as { stderr?: string }).stderr ?? e.message) : String(e);
    if (/HTTP 404/.test(msg)) heavyMoverLabelExists = false;
    else errors.push(`could not ask whether label \`${HEAVY_MOVER_LABEL}\` exists: ${msg.trim().split("\n")[0]}`);
  }

  let prs: PrPathSet[] | undefined;
  try {
    const heads = ghLines<{ number: number; title: string; draft: boolean; labels: string[] }>(
      `repos/${repository}/pulls?state=open&per_page=100`,
      ".[] | {number, title, draft, labels: [.labels[].name]} | tojson",
    );
    prs = heads.map((h) => {
      const changedFiles = Number(gh(["api", `repos/${repository}/pulls/${h.number}`, "--jq", ".changed_files"]).trim());
      const files = ghLines<PrFile>(
        `repos/${repository}/pulls/${h.number}/files?per_page=100`,
        ".[] | {path: .filename, status, previousPath: .previous_filename} | tojson",
      ).map((f) => (f.previousPath ? f : { path: f.path, status: f.status }));
      return { ...h, changedFiles, files };
    });
  } catch (e) {
    const msg = e instanceof Error ? String((e as { stderr?: string }).stderr ?? e.message) : String(e);
    errors.push(`could not list open PRs of ${repository}: ${msg.trim().split("\n")[0]}`);
  }

  return { repository, heavyMoverLabelExists, prs, errors };
}

// ─── the criteria ───────────────────────────────────────────────────────────

export type Verdict = "pass" | "fail" | "could-not-determine";

/** One PR's part in a criterion. */
export interface Offender {
  number: number;
  title: string;
  /** The paths that put it here (capped for the report; `pathCount` is the total). */
  paths: string[];
  pathCount: number;
}

export interface CriterionReport {
  id: "heavy-movers" | "next-layer" | "layer-load" | "layer-moves";
  /** The fact this criterion hands the decision table. */
  fact: "heavyMoversOpen" | "nextLayerPrs" | "layerPrs" | "layerMovingPrs";
  statement: string;
  verdict: Verdict;
  /** PRs that certainly count. */
  count: number;
  offenders: Offender[];
  /** PRs whose unseen files could change the answer. */
  undetermined: number[];
  note?: string;
}

export interface ReadinessReport {
  layer: string;
  dir: string;
  depth: number;
  next: { name: string; dir: string }[];
  repository: string;
  /** The gateway's branch: `settled`, `not yet`, or `unknown`. */
  outcome: string;
  rule: string;
  facts: Record<string, number>;
  criteria: CriterionReport[];
  errors: string[];
  decision: string;
}

const under = (path: string, dir: string): boolean => path === dir || path.startsWith(`${dir}/`);
const inAny = (path: string, dirs: string[]): boolean => dirs.some((d) => under(path, d));

/** Every path a file entry touches: where it is, and where it was. */
const touched = (f: PrFile): string[] => (f.previousPath ? [f.path, f.previousPath] : [f.path]);

/** A move in `dirs`: a deletion there, or a rename into or out of it. */
const movesIn = (f: PrFile, dirs: string[]): boolean =>
  (f.status === "removed" && inAny(f.path, dirs)) || (f.status === "renamed" && touched(f).some((p) => inAny(p, dirs)));

const complete = (pr: PrPathSet): boolean => pr.files.length >= pr.changedFiles;

const OFFENDER_PATHS = 5;

/**
 * Classify every PR against a file predicate: certainly in (some file
 * matches), certainly out (nothing matches and the path set is whole), or
 * undetermined (nothing seen matches, but GitHub did not return every file).
 */
function classify(prs: PrPathSet[], match: (f: PrFile) => boolean): { hit: Offender[]; unknown: number[] } {
  const hit: Offender[] = [];
  const unknown: number[] = [];
  for (const pr of prs) {
    const paths = pr.files.filter(match).flatMap(touched);
    if (paths.length > 0) {
      const uniq = [...new Set(paths)];
      hit.push({ number: pr.number, title: pr.title, paths: uniq.slice(0, OFFENDER_PATHS), pathCount: uniq.length });
    } else if (!complete(pr)) {
      unknown.push(pr.number);
    }
  }
  return { hit, unknown };
}

/** The facts all at their clean value — the baseline a single criterion is judged against. */
const CLEAN = { heavyMoversOpen: 0, nextLayerPrs: 0, layerPrs: 0, layerMovingPrs: 0, undetermined: 0 };

/**
 * Judge the layer. Pure: the plan, the forge snapshot and the table in, the
 * report out.
 *
 * Each criterion's verdict is the TABLE's answer with every other fact at its
 * clean value, so a threshold such as "at most N PRs touch L" is read from the
 * DMN and stated nowhere else. The overall outcome is the table over all the
 * facts together.
 */
export function assess(plan: LayerPlan, forge: ForgeSnapshot, table: DecisionTable): ReadinessReport {
  const L = [plan.layer.dir];
  const N = plan.next.map((n) => n.dir);
  const errors = [...forge.errors];

  const criteria: CriterionReport[] = [];
  const add = (c: Omit<CriterionReport, "verdict">, cannotAsk: boolean): void => {
    const partial = cannotAsk || c.undetermined.length > 0;
    const r = evaluate(table, { ...CLEAN, [c.fact]: c.count, undetermined: partial ? 1 : 0 });
    const verdict: Verdict = r.outcome === "settled" ? "pass" : r.outcome === "not yet" ? "fail" : "could-not-determine";
    criteria.push({ ...c, verdict });
  };

  const prs = forge.prs;
  if (prs === undefined) {
    for (const [id, fact, statement] of STATEMENTS(plan)) {
      add({ id, fact, statement, count: 0, offenders: [], undetermined: [], note: "open PRs could not be read" }, true);
    }
  } else {
    // heavy movers — the marker, scoped to the PRs that touch L or L+1.
    {
      const scope = [...L, ...N];
      const labelled = prs.filter((p) => p.labels.includes(HEAVY_MOVER_LABEL));
      const { hit, unknown } = classify(labelled, (f) => touched(f).some((p) => inAny(p, scope)));
      const markerMissing = forge.heavyMoverLabelExists !== true;
      const [id, fact, statement] = STATEMENTS(plan)[0];
      add(
        {
          id,
          fact,
          statement,
          count: hit.length,
          offenders: hit,
          undetermined: unknown,
          note:
            forge.heavyMoverLabelExists === false
              ? `the label \`${HEAVY_MOVER_LABEL}\` does not exist on ${forge.repository}, so no PR can carry the marker — absence of the marker is not absence of heavy movers`
              : forge.heavyMoverLabelExists === undefined
                ? `whether the label \`${HEAVY_MOVER_LABEL}\` exists could not be asked`
                : undefined,
        },
        markerMissing,
      );
    }
    // next layer
    {
      const [id, fact, statement] = STATEMENTS(plan)[1];
      if (N.length === 0) {
        add({ id, fact, statement, count: 0, offenders: [], undetermined: [], note: "no instance sits one level above this layer" }, false);
      } else {
        const { hit, unknown } = classify(prs, (f) => touched(f).some((p) => inAny(p, N)));
        add({ id, fact, statement, count: hit.length, offenders: hit, undetermined: unknown }, false);
      }
    }
    // layer load
    {
      const [id, fact, statement] = STATEMENTS(plan)[2];
      const { hit, unknown } = classify(prs, (f) => touched(f).some((p) => inAny(p, L)));
      add({ id, fact, statement, count: hit.length, offenders: hit, undetermined: unknown }, false);
    }
    // moves in the layer
    {
      const [id, fact, statement] = STATEMENTS(plan)[3];
      const { hit, unknown } = classify(prs, (f) => movesIn(f, L));
      add({ id, fact, statement, count: hit.length, offenders: hit, undetermined: unknown }, false);
    }
  }

  const facts: Record<string, number> = { ...CLEAN };
  for (const c of criteria) facts[c.fact] = c.count;
  facts.undetermined = criteria.filter((c) => c.verdict === "could-not-determine").length;
  const r = evaluate(table, facts);

  return {
    layer: plan.layer.name,
    dir: plan.layer.dir,
    depth: plan.depth,
    next: plan.next.map((n) => ({ name: n.name, dir: n.dir })),
    repository: forge.repository,
    outcome: String(r.outcome),
    rule: r.rule,
    facts,
    criteria,
    errors,
    decision: `${relative(process.cwd(), SEED_READINESS_DMN)}#${SEED_READINESS_DECISION}`,
  };
}

function STATEMENTS(plan: LayerPlan): [CriterionReport["id"], CriterionReport["fact"], string][] {
  const L = `\`${plan.layer.dir}/\``;
  const N = plan.next.length === 0 ? "(none)" : plan.next.map((n) => `\`${n.dir}/\``).join(", ");
  return [
    ["heavy-movers", "heavyMoversOpen", `no open PR labelled \`${HEAVY_MOVER_LABEL}\` touches ${L} or the next layer`],
    ["next-layer", "nextLayerPrs", `no open PR touches the next layer: ${N}`],
    ["layer-load", "layerPrs", `few open PRs touch ${L} (the limit is the decision table's)`],
    ["layer-moves", "layerMovingPrs", `no open PR renames or deletes a file in ${L}`],
  ];
}

// ─── the report ─────────────────────────────────────────────────────────────

export function renderText(r: ReadinessReport): string {
  const lines: string[] = [];
  lines.push(`seed:ready --layer ${r.layer}  (${r.dir}/, depth ${r.depth}; next: ${r.next.map((n) => n.name).join(", ") || "none"})`);
  lines.push(`repository: ${r.repository}`);
  lines.push(`gateway "Source settled?" → ${r.outcome}   [${r.rule}]`);
  lines.push("");
  for (const c of r.criteria) {
    lines.push(`  ${c.verdict.padEnd(19)} ${c.statement} — ${c.count} PR(s)`);
    for (const o of c.offenders) {
      const more = o.pathCount > o.paths.length ? ` (+${o.pathCount - o.paths.length} more)` : "";
      lines.push(`      #${o.number} ${o.title.slice(0, 70)}`);
      lines.push(`        ${o.paths.join(", ")}${more}`);
    }
    if (c.undetermined.length > 0) {
      lines.push(`      undetermined (more than ${GITHUB_FILES_CAP} files; unseen part could count): ${c.undetermined.map((n) => `#${n}`).join(", ")}`);
    }
    if (c.note) lines.push(`      note: ${c.note}`);
  }
  for (const e of r.errors) lines.push(`  error: ${e}`);
  lines.push("");
  lines.push(`decision: ${r.decision}. This reports only; it never seeds.`);
  return lines.join("\n");
}

/** Exit code for an outcome: 0 settled, 1 not yet, 2 unknown. */
export function exitCodeFor(outcome: string): number {
  return outcome === "settled" ? 0 : outcome === "not yet" ? 1 : 2;
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function arg(name: string, argv: string[]): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function main(argv: string[]): Promise<number> {
  const name = arg("--layer", argv);
  if (!name) {
    console.error("usage: seed:ready --layer <instance> [--fixture <file.json>] [--text]");
    return 2;
  }
  const repoRoot = repoRootFor(resolve(import.meta.dir, ".."));
  const plan = planLayer(readLayers(repoRoot), name);
  if (!plan.layer.stagedIn) {
    console.error(
      `\`${name}\` declares no \`livesAt\`: it is not staged in this repository, so there is nothing here to seed it from.`,
    );
    return 2;
  }

  const fixture = arg("--fixture", argv);
  const forge: ForgeSnapshot = fixture
    ? { errors: [], ...(JSON.parse(readFileSync(fixture, "utf-8")) as Omit<ForgeSnapshot, "errors">) }
    : fetchForge(plan.layer.stagedIn);

  const table = await loadDecisionTable(SEED_READINESS_DMN, SEED_READINESS_DECISION);
  const report = assess(plan, forge, table);
  console.log(argv.includes("--text") ? renderText(report) : JSON.stringify(report, null, 2));
  return exitCodeFor(report.outcome);
}

if (import.meta.main) {
  process.exit(await main(process.argv.slice(2)));
}
