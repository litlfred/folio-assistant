/**
 * Is the source of a staged layer settled enough to seed it?
 *
 * ```sh
 * bun run seed:ready --layer cat-harness           # JSON report, exit 0/1/2
 * bun run seed:ready --layer cat-harness --text    # the same, for a person
 * bun run seed:ready --layer cat-harness --fixture prs.json   # offline
 * ```
 *
 * This evaluates `GW_SeedReady` — "Ready to seed?" — in `kg-separation.bpmn`,
 * the gateway between `Create the repositories` and `10 · Seed`. The decision
 * itself is `seed-readiness-gate.dmn`, found by NAME through `workflowFile`
 * rather than by a composed path, so the next regroup of `processes/` does not
 * break it. This script gathers the facts and hands them to the table, so
 * **every threshold lives in the table and none lives here**. Change the
 * table, not this file.
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
 * | `layerMovingPrs`   | open PRs that delete a file in L, or rename one into or out of it |
 * | `standaloneRed`    | failing tests when L and what it needs run as sibling clones |
 * | `upwardPaths`      | paths DECLARED in L that resolve only in an instance above L |
 * | `undetermined`     | criteria this run could not decide                           |
 *
 * The first four ask whether the SOURCE is still moving; the last two re-ask,
 * at seed time, whether the layer can stand alone — `8 · Rehearse` asked it
 * once, and main has moved since.
 *
 * ## The rehearsal runs only on request — the owner's ruling
 *
 * Owner, 2026-10-02: "Optional, run only on request with --rehearse."
 * `--rehearse` copies the layer and everything it needs into a scratch
 * workspace of sibling directories and runs `bun test` there; for cat-harness
 * that is ~150 MB and ~8,000 tests. Without it the standalone criterion is
 * `could-not-determine`, so `seed:ready` cannot answer `settled` until a
 * rehearsal has run. That consequence is ONE constant,
 * {@link SETTLED_REQUIRES_REHEARSAL}.
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
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statfsSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

import { instanceRootsIn, readDeclaration, repoRootFor } from "../schemas/cat-harness.js";
import { clearCheckoutCache, resolveImplementingPath } from "../schemas/harness-config.js";
import { toolsOf } from "../tools/discover.js";
import { QA_CRITERIA_BY_ID, getCriterionSourceFile } from "../content/pipeline/qa-criteria-registry.js";
import { RENDER_TARGETS } from "../schemas/render-targets.js";
import { evaluate, loadDecisionTable, type DecisionTable } from "../src/workflow/decision-table.js";
import { workflowFile } from "./known-skills.js";

/** This instance's root — where the declared `processes` graph is found from. */
const INSTANCE_ROOT = resolve(import.meta.dir, "..");

/** The decision table's FILE NAME; {@link seedReadinessDmn} finds it. */
export const SEED_READINESS_DMN_NAME = "seed-readiness-gate.dmn";
export const SEED_READINESS_DECISION = "Decision_SeedReadiness";

/** The decision table this script evaluates, wherever the declared `processes` graph put it. */
export function seedReadinessDmn(root: string = INSTANCE_ROOT): string {
  return workflowFile(root, SEED_READINESS_DMN_NAME);
}

/**
 * Whether `settled` needs a rehearsal to have run. Owner, 2026-10-02:
 * "Optional, run only on request with --rehearse" — and an un-run rehearsal
 * is `could-not-determine`, never a pass. `false` would report it `not-run`
 * and leave it out of the decision; that is a change to the ruling, not a
 * tuning knob.
 */
export const SETTLED_REQUIRES_REHEARSAL = true;

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
  /** Absolute path of the directory the declaration was read from. */
  root?: string;
  /** Instances this one is seeded together with (`seedsWith`); absent is "alone". */
  seedsWith?: string[];
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
      root: resolve(at),
      ...(d.seedsWith ? { seedsWith: d.seedsWith } : {}),
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

/**
 * JSON-lines output of `gh api --jq '.[] | …'` over every page.
 *
 * Paged by `page=N` rather than `--paginate`: GitHub's `Link` headers name
 * the `repositories/{id}/…` form, which the agent proxy refuses (HTTP 403),
 * so `--paginate` fails on the second page of exactly the repositories that
 * have one. `path` must already carry `per_page=100`.
 */
function ghLines<T>(path: string, jq: string): T[] {
  const out: T[] = [];
  for (let page = 1; ; page++) {
    const lines = gh(["api", `${path}&page=${page}`, "--jq", jq])
      .split("\n")
      .filter((l) => l.trim() !== "");
    for (const l of lines) out.push(JSON.parse(l) as T);
    if (lines.length < 100) return out;
  }
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

/** `not-run`: an opt-in probe that was not asked for and is not required. */
export type Verdict = "pass" | "fail" | "could-not-determine" | "not-run";

/** One PR's part in a criterion. */
export interface Offender {
  number: number;
  title: string;
  /** The paths that put it here (capped for the report; `pathCount` is the total). */
  paths: string[];
  pathCount: number;
}

export type CriterionId = "heavy-movers" | "next-layer" | "layer-load" | "layer-moves" | "standalone" | "upward-paths";
export type Fact =
  | "heavyMoversOpen"
  | "nextLayerPrs"
  | "layerPrs"
  | "layerMovingPrs"
  | "standaloneRed"
  | "upwardPaths";

export interface CriterionReport {
  id: CriterionId;
  /** The fact this criterion hands the decision table. */
  fact: Fact;
  statement: string;
  verdict: Verdict;
  /** PRs that certainly count. */
  count: number;
  offenders: Offender[];
  /** PRs whose unseen files could change the answer. */
  undetermined: number[];
  /** For the two non-PR criteria: what was found (failing tests, missed instances). */
  findings?: string[];
  note?: string;
}

/**
 * A probe that is not about PRs — the rehearsal, sibling discovery. `measured`
 * carries the count the table sees and what made it up; `not-run` is a probe
 * nobody asked for; `error` is a probe that was asked and could not answer,
 * which is never a pass.
 */
export type Probe =
  | { state: "measured"; count: number; findings: string[]; note?: string }
  | { state: "not-run"; note: string }
  | { state: "error"; note: string };

export interface Probes {
  standalone: Probe;
  upward: Probe;
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
export const CLEAN: Record<Fact | "undetermined", number> = {
  heavyMoversOpen: 0,
  nextLayerPrs: 0,
  layerPrs: 0,
  layerMovingPrs: 0,
  standaloneRed: 0,
  upwardPaths: 0,
  undetermined: 0,
};

/**
 * Judge the layer. Pure: the plan, the forge snapshot and the table in, the
 * report out.
 *
 * Each criterion's verdict is the TABLE's answer with every other fact at its
 * clean value, so a threshold such as "at most N PRs touch L" is read from the
 * DMN and stated nowhere else. The overall outcome is the table over all the
 * facts together.
 */
export function assess(
  plan: LayerPlan,
  forge: ForgeSnapshot,
  table: DecisionTable,
  probes: Probes = {
    standalone: { state: "not-run", note: "rehearsal not requested (--rehearse)" },
    upward: { state: "not-run", note: "upward paths not probed" },
  },
  decision = `${SEED_READINESS_DMN_NAME}#${SEED_READINESS_DECISION}`,
): ReadinessReport {
  const L = [plan.layer.dir];
  const N = plan.next.map((n) => n.dir);
  const errors = [...forge.errors];

  const criteria: CriterionReport[] = [];
  const add = (c: Omit<CriterionReport, "verdict">, cannotAsk: boolean, notRun = false): void => {
    if (notRun) {
      criteria.push({ ...c, verdict: "not-run" });
      return;
    }
    const partial = cannotAsk || c.undetermined.length > 0;
    const r = evaluate(table, { ...CLEAN, [c.fact]: c.count, undetermined: partial ? 1 : 0 });
    const verdict: Verdict = r.outcome === "settled" ? "pass" : r.outcome === "not yet" ? "fail" : "could-not-determine";
    criteria.push({ ...c, verdict });
  };

  const prs = forge.prs;
  if (prs === undefined) {
    for (const [id, fact, statement] of STATEMENTS(plan).slice(0, 4)) {
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

  // The two probes — not about PRs, so they have no path sets to classify.
  const probeCriterion = (i: 4 | 5, p: Probe, requiredWhenNotRun: boolean): void => {
    const [id, fact, statement] = STATEMENTS(plan)[i];
    const base = { id, fact, statement, offenders: [], undetermined: [] };
    if (p.state === "measured") {
      add({ ...base, count: p.count, findings: p.findings, note: p.note }, false);
    } else if (p.state === "error") {
      add({ ...base, count: 0, note: p.note }, true);
    } else {
      add({ ...base, count: 0, note: p.note }, requiredWhenNotRun, !requiredWhenNotRun);
    }
  };
  probeCriterion(4, probes.standalone, SETTLED_REQUIRES_REHEARSAL);
  // Upward paths are cheap and the CLI always probes them; not probing them is never a pass.
  probeCriterion(5, probes.upward, true);

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
    decision,
  };
}

function STATEMENTS(plan: LayerPlan): [CriterionId, Fact, string][] {
  const L = `\`${plan.layer.dir}/\``;
  const N = plan.next.length === 0 ? "(none)" : plan.next.map((n) => `\`${n.dir}/\``).join(", ");
  return [
    ["heavy-movers", "heavyMoversOpen", `no open PR labelled \`${HEAVY_MOVER_LABEL}\` touches ${L} or the next layer`],
    ["next-layer", "nextLayerPrs", `no open PR touches the next layer: ${N}`],
    ["layer-load", "layerPrs", `few open PRs touch ${L} (the limit is the decision table's)`],
    ["layer-moves", "layerMovingPrs", `no open PR renames or deletes a file in ${L}`],
    ["standalone", "standaloneRed", `${L} is green with only what it needs beside it, as sibling clones`],
    [
      "upward-paths",
      "upwardPaths",
      `every path declared in ${L} resolves inside ${L} — none only in an instance above it`,
    ],
  ];
}

// ─── the two standalone probes ──────────────────────────────────────────────

/** Where a declaration actually sits on disk — `root` when read, else `dir` under the checkout. */
const rootOf = (repoRoot: string, d: LayerDecl): string => d.root ?? resolve(repoRoot, d.dir);

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e)).trim().split("\n")[0]!;

/** One path a layer DECLARES and something resolves through `resolveImplementingPath`. */
export interface DeclaredPath {
  kind: "tool-module" | "criterion-source" | "render-target";
  /** The Tool id, criterion id or content profile that declares it. */
  owner: string;
  path: string;
}

/**
 * Every path declared in this layer that a reader resolves through
 * `resolveImplementingPath` — the three registries whose callers do so today
 * (`check-tools`, `script-sweep`/`criterion-source`, `render-discovery`).
 *
 * Tool modules are read per declaring instance (`toolsOf`); the QA criteria
 * and render targets are the harness's own registries, so they are declared
 * by `cat-harness` and by no other layer.
 */
export function declaredPathsOf(layerRoot: string): DeclaredPath[] {
  const out: DeclaredPath[] = [];
  for (const t of toolsOf(layerRoot)) {
    const inv = t.invoke as Record<string, unknown> | undefined;
    for (const arm of ["inProcess", "container", "mcp"]) {
      const a = inv?.[arm] as { module?: unknown } | undefined;
      if (a && typeof a.module === "string") out.push({ kind: "tool-module", owner: t.id, path: a.module });
    }
  }
  if (resolve(layerRoot) === INSTANCE_ROOT) {
    for (const [id, def] of Object.entries(QA_CRITERIA_BY_ID)) {
      // A contributed checker is resolved through the contribution registry,
      // not through this path; `getCriterionSourceFile` refuses it by design.
      if (def.checker_contributed) continue;
      out.push({ kind: "criterion-source", owner: id, path: getCriterionSourceFile(id) });
    }
    for (const [profile, decl] of Object.entries(RENDER_TARGETS)) {
      if (decl?.module) out.push({ kind: "render-target", owner: profile, path: decl.module });
    }
  }
  return out;
}

/**
 * Paths declared in this layer that resolve ONLY in an instance above it.
 *
 * ## Why this replaced "sibling discovery" (owner, 2026-10-04)
 *
 * The criterion it replaces counted the instances that `needs` L which
 * discovery could not find in a workspace of sibling clones. Two things were
 * wrong with that count. Discovery is checkout-local ON PURPOSE — `cmsl`:
 * *"the tool sees what the checkout contains, not what the platform
 * remembers having been next to"* — so a seeded layer can never discover its
 * dependents, and the criterion could never pass. And the count was of
 * INSTANCES, while the risk it named was PATHS: *"each one it cannot find …
 * is a path resolved through it that fails the day the layer is seeded."*
 * Measured that day on cat-harness: 3 instances missed, and **0** declared
 * paths resolving through any of them (25 of 25 in-process Tool modules, and
 * all 8 distinct QA criterion source files, resolve inside cat-harness).
 *
 * So this counts the paths themselves. A path resolving `via: "needs"` is one
 * that breaks when L stands alone — UNLESS the instance holding it declares
 * `seedsWith: [L]`, in which case the same seeding step creates both and the
 * path is stated in the note rather than counted (owner, 2026-10-04: the
 * harness's Tool nodes resolving into cat-harness-tools are a seeding pair); `ambiguous` counts too, since two
 * implementers above L is the same dependence twice. A `missing` path is not
 * counted here — it is broken in the monorepo already, and `check:tools`
 * owns that.
 */
export function probeUpwardPaths(repoRoot: string, layerName: string, decls: LayerDecl[]): Probe {
  const layer = decls.find((d) => d.name === layerName);
  if (!layer) return { state: "error", note: `no declaration named \`${layerName}\`` };
  const root = rootOf(repoRoot, layer);
  let paths: DeclaredPath[];
  try {
    paths = declaredPathsOf(root);
  } catch (e) {
    return { state: "error", note: `the declared paths could not be read: ${message(e)}` };
  }
  const upward: string[] = [];
  // Declared by the instance ABOVE (`seedsWith`): one seeding step creates
  // both, so a path into it cannot break on the day L is seeded (owner,
  // 2026-10-04). Counted and stated, never silently dropped.
  const partners = new Set(decls.filter((d) => d.seedsWith?.includes(layerName)).map((d) => d.name));
  const intoPartner = new Map<string, number>();
  try {
    clearCheckoutCache();
    for (const p of paths) {
      const r = resolveImplementingPath(root, p.path);
      if (r.state === "found" && r.via === "needs" && partners.has(r.instance)) {
        intoPartner.set(r.instance, (intoPartner.get(r.instance) ?? 0) + 1);
      } else if (r.state === "found" && r.via === "needs") {
        upward.push(`${p.kind} ${p.owner}: ${p.path} resolves only in ${r.instance}, above ${layerName}`);
      } else if (r.state === "ambiguous") {
        upward.push(`${p.kind} ${p.owner}: ${p.path} is held by ${r.candidates.map((c) => c.name).join(" and ")}, above ${layerName}`);
      }
    }
  } catch (e) {
    return { state: "error", note: `upward paths could not be probed: ${message(e)}` };
  } finally {
    clearCheckoutCache();
  }
  return {
    state: "measured",
    count: upward.length,
    findings: upward,
    // The Tool count is stated so that "0 paths" over a layer whose Tools are
    // all shell-invoked reads as determined, not as a probe that read nothing.
    note:
      `${paths.length} declared path(s) checked — tool modules (from ${toolsOf(root).length} Tool node(s)), QA criterion sources, render targets` +
      [...intoPartner].map(([name, n]) => `; ${n} resolve into \`${name}\`, which is seeded with ${layerName} (seedsWith)`).join(""),
  };
}

/** Free space the rehearsal insists on before copying a layer. */
export const REHEARSAL_MIN_FREE_BYTES = 3 * 1024 ** 3;

/** The layer and everything it needs, transitively, among the declarations here. */
export function closureOf(decls: LayerDecl[], name: string): LayerDecl[] {
  const byName = new Map(decls.map((d) => [d.name, d]));
  const out = new Map<string, LayerDecl>();
  const walk = (n: string): void => {
    const d = byName.get(n);
    if (!d || out.has(n)) return;
    out.set(n, d);
    for (const x of d.needs) walk(x);
  };
  walk(name);
  return [...out.values()];
}

/** `N fail` from `bun test`'s summary, and the `(fail)` lines above it. */
export function parseBunTest(output: string): { failed: number; names: string[] } | undefined {
  const m = /^\s*(\d+)\s+fail\b/m.exec(output);
  if (!m) return undefined;
  const names = output
    .split("\n")
    .filter((l) => l.trimStart().startsWith("(fail)"))
    .map((l) => l.trim().replace(/^\(fail\)\s*/, ""));
  return { failed: Number(m[1]), names: [...new Set(names)] };
}

/**
 * The standalone rehearsal, run only with `--rehearse` (owner, 2026-10-02).
 *
 * Copies the TRACKED files of the layer and of everything it needs into a
 * scratch workspace as sibling directories — no aggregate declaration at the
 * root — links the checkout's `node_modules` beside them, and runs `bun test`
 * in the layer's directory. The root `package.json`, `tsconfig.json` and
 * `bunfig.toml` are copied too, standing in for the ones each seeded
 * repository will carry; none of them is a declaration, so discovery still
 * sees no aggregate.
 *
 * Anything that stops it from producing a test summary — too little disk, a
 * timeout, an unparseable run — is `error`, never a pass.
 */
export function probeStandalone(
  repoRoot: string,
  layerName: string,
  decls: LayerDecl[],
  opts: { timeoutMs?: number } = {},
): Probe {
  try {
    const st = statfsSync(tmpdir());
    const free = Number(st.bavail) * Number(st.bsize);
    if (free < REHEARSAL_MIN_FREE_BYTES) {
      return { state: "error", note: `only ${(free / 1024 ** 3).toFixed(1)} GB free under ${tmpdir()}; the rehearsal needs 3` };
    }
  } catch (e) {
    return { state: "error", note: `could not ask how much disk is free: ${message(e)}` };
  }

  const members = closureOf(decls, layerName);
  const layer = members.find((d) => d.name === layerName);
  if (!layer) return { state: "error", note: `no declaration named \`${layerName}\`` };

  let ws: string | undefined;
  try {
    ws = mkdtempSync(join(tmpdir(), "seed-ready-rehearsal-"));
    for (const d of members) {
      const rel = relative(repoRoot, rootOf(repoRoot, d));
      const listed = execFileSync("git", ["-C", repoRoot, "ls-files", "-z", "--recurse-submodules", "--", rel], {
        encoding: "utf-8",
        maxBuffer: 256 * 1024 * 1024,
      })
        .split("\0")
        .filter((f) => f !== "");
      for (const f of listed) {
        const src = join(repoRoot, f);
        if (!existsSync(src)) continue; // deleted in the worktree but still in the index
        const dst = join(ws, f);
        mkdirSync(dirname(dst), { recursive: true });
        copyFileSync(src, dst);
      }
    }
    for (const f of ["package.json", "tsconfig.json", "bunfig.toml"]) {
      if (existsSync(join(repoRoot, f))) copyFileSync(join(repoRoot, f), join(ws, f));
    }
    if (existsSync(join(repoRoot, "node_modules"))) symlinkSync(join(repoRoot, "node_modules"), join(ws, "node_modules"));

    const cwd = join(ws, relative(repoRoot, rootOf(repoRoot, layer)));
    const run = spawnSync("bun", ["test"], {
      cwd,
      encoding: "utf-8",
      maxBuffer: 512 * 1024 * 1024,
      timeout: opts.timeoutMs ?? 60 * 60 * 1000,
    });
    if (run.error) return { state: "error", note: `bun test could not run: ${message(run.error)}` };
    const parsed = parseBunTest(`${run.stdout}\n${run.stderr}`);
    if (!parsed) return { state: "error", note: `bun test exited ${run.status} with no summary to read` };
    return {
      state: "measured",
      count: parsed.failed,
      findings: parsed.names,
      note: `${members.map((m) => m.name).join(", ")} laid out as siblings`,
    };
  } catch (e) {
    return { state: "error", note: `the rehearsal could not be set up: ${message(e)}` };
  } finally {
    if (ws) rmSync(ws, { recursive: true, force: true });
  }
}

// ─── the report ─────────────────────────────────────────────────────────────

export function renderText(r: ReadinessReport): string {
  const lines: string[] = [];
  lines.push(`seed:ready --layer ${r.layer}  (${r.dir}/, depth ${r.depth}; next: ${r.next.map((n) => n.name).join(", ") || "none"})`);
  lines.push(`repository: ${r.repository}`);
  lines.push(`gateway "Ready to seed?" → ${r.outcome}   [${r.rule}]`);
  lines.push("");
  for (const c of r.criteria) {
    const unit = c.id === "standalone" ? "failing test(s)" : c.id === "upward-paths" ? "path(s)" : "PR(s)";
    lines.push(`  ${c.verdict.padEnd(19)} ${c.statement} — ${c.count} ${unit}`);
    for (const f of (c.findings ?? []).slice(0, 10)) lines.push(`      ${f}`);
    if ((c.findings?.length ?? 0) > 10) lines.push(`      (+${c.findings!.length - 10} more)`);
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
    console.error("usage: seed:ready --layer <instance> [--rehearse] [--fixture <file.json>] [--text]");
    return 2;
  }
  const repoRoot = repoRootFor(INSTANCE_ROOT);
  const decls = readLayers(repoRoot);
  const plan = planLayer(decls, name);
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

  const probes: Probes = {
    standalone: argv.includes("--rehearse")
      ? probeStandalone(repoRoot, name, decls)
      : { state: "not-run", note: "run only on request: pass --rehearse (owner, 2026-10-02)" },
    upward: probeUpwardPaths(repoRoot, name, decls),
  };

  const dmn = seedReadinessDmn();
  const table = await loadDecisionTable(dmn, SEED_READINESS_DECISION);
  const report = assess(plan, forge, table, probes, `${relative(process.cwd(), dmn)}#${SEED_READINESS_DECISION}`);
  console.log(argv.includes("--text") ? renderText(report) : JSON.stringify(report, null, 2));
  return exitCodeFor(report.outcome);
}

if (import.meta.main) {
  process.exit(await main(process.argv.slice(2)));
}
