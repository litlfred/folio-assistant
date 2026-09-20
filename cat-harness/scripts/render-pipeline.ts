#!/usr/bin/env bun
/**
 * render-pipeline.ts — the repository's renders, in the order their
 * dependencies imply, with the failure policy declared per step.
 *
 * ## The order is the owner's, and it is two stages rather than one
 *
 * Asked where the README render belongs, 2026-09-20:
 *
 * > bootsterap rended in main as exception. json/jsonld rendered last as
 * > intermeridaay renderes may add to dynamic KG. means maybe two stage
 * > rendering.... current state of KG renderered as json/jsonld failuer =
 * > fatal, readme updated faliure = fatal , dynamic parts (kg vierwe,
 * > visaluzers, etc) render in flattened depndency order, failures =
 * > skip/log/qa or so. dynamic content then hets get json/jsonld export
 * > avaiable under cat-harness/state.jsonld or so
 *
 * Two exports, not one, and that is what resolves the apparent contradiction
 * in "json/jsonld first" and "json/jsonld last": they are different documents.
 *
 * | stage | what it renders | on failure |
 * |---|---|---|
 * | 1 | the CURRENT declared state, as json/jsonld — then the README from it | **fatal** |
 * | 2 | the dynamic parts: viewers, visualisers, doc pages, diagrams | skip + log |
 * | 3 | the dynamic state, exported once the stage-2 renderers have contributed | fatal |
 *
 * **Stage 1 is fatal because everything downstream is derived from it.** A KG
 * that does not render is not a degraded build, it is an unknown one, and a
 * README generated from a half-read graph states a wrong fact in the file a
 * reader opens first. **Stage 2 is not fatal** because a missing visualiser
 * costs one rendering and nothing else — the `skip/log/qa` the owner asked
 * for. That policy lives on each {@link OrderedStep}, not in this runner: see
 * `dependency-order.ts` for why.
 *
 * ## Bootstrap is the exception, and it is declared as one
 *
 * *"bootsterap rended in main as exception"* — cat-bootstrap renders before
 * the graph is read at all, because it is what an agent reads when no harness
 * is installed and therefore cannot depend on one having rendered. It is the
 * same exemption `check:subgraph-coverage` already grants it from the
 * `visualiser` criterion, and it is a SECOND criterion rather than a hole:
 * bootstrap owes its own .json/.jsonld instead.
 *
 * ## What this file is NOT
 *
 * It is not a second CI workflow. `docs-site.yml` remains what publishes; this
 * declares the ORDER and the policy in one readable place, runs it locally,
 * and gives CI one thing to call per stage. A pipeline order that exists only
 * as the sequence of steps in a YAML file is an order nobody can test — and
 * this repository has a bean (`xom7`) about exactly what a workflow's
 * behaviour costs when the repository holds no statement of it.
 *
 * @module scripts/render-pipeline
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { flattenDependencies, runInOrder, type OrderedStep } from "./dependency-order.js";
import { instanceRootFor, repoRootFor } from "../schemas/cat-harness.js";

/** A step, plus the command that performs it. */
interface RenderStep extends OrderedStep {
  /** Argv, run from the repository root. */
  run?: string[];
  /**
   * This step is DECLARED but not yet performable, and why.
   *
   * A third outcome, and it exists because the first draft did not have it:
   * the bootstrap step was written as `kg-export --root cat-bootstrap`, and
   * `kg-export` has no `--root` flag. The argument would have been ignored and
   * the whole graph exported under bootstrap's name — a step reporting success
   * while doing something else entirely, which is the one failure a pipeline
   * report must never produce. Naming the gap costs a line; discovering it
   * from a wrong artefact costs a release.
   */
  pending?: string;
}

/**
 * The pipeline, declared.
 *
 * `needs` is the ONLY thing that orders this list — the array order here is
 * the tie-break and nothing more, so a step can be moved without changing
 * what runs when. Read the `needs` field, not the position.
 */
export function pipeline(scratch: string): RenderStep[] {
  return [
    // ── Stage 0: the exception ──────────────────────────────────────────
    //
    // It depends on NOTHING and nothing depends on it, which is what "as an
    // exception" means here: bootstrap is read when no harness is installed,
    // so it cannot wait on the graph and the graph must not wait on it.
    {
      id: "bootstrap",
      fatal: false,
      label: "cat-bootstrap's own json/jsonld — renders before the graph is read",
      pending:
        "cat-bootstrap owes its own .json/.jsonld (bean `hfkl`, and the exemption in `check:subgraph-coverage` says so) and no exporter takes an instance root yet",
    },

    // ── Stage 1: current state, then the README derived from it ─────────
    {
      id: "kg-current",
      fatal: true,
      label: "the CURRENT declared state as json/jsonld — fatal: everything below is derived from it",
      run: ["bun", "run", "cat-harness/scripts/kg-export.ts", "--out", join(scratch, "current.jsonld")],
    },
    {
      id: "readme",
      needs: ["kg-current"],
      fatal: true,
      label: "the repository README's generated sections — fatal: it is the file a reader opens first",
      // `--dir .` is the REPOSITORY instance. Without it the sync resolves to
      // whichever instance carries a `folio/`, which is cat-harness — whose
      // README carries no markers, so the root's instances table would go
      // stale while the command reported success.
      run: ["bun", "run", "readme:sync", "--dir", "."],
    },

    // ── Stage 2: the dynamic parts, skip/log on failure ─────────────────
    { id: "schema-docs", needs: ["readme"], fatal: false, label: "skill schema reference", run: ["bun", "run", "cat-harness/scripts/gen-schema-docs.ts"] },
    { id: "skill-docs", needs: ["readme"], fatal: false, label: "skill instruction pages", run: ["bun", "run", "cat-harness/scripts/gen-skill-docs.ts"] },
    { id: "docs-pages", needs: ["readme"], fatal: false, label: "content-backed docs pages", run: ["bun", "run", "cat-harness/scripts/gen-docs-pages.ts"] },
    { id: "bpmn", needs: ["readme"], fatal: false, label: "BPMN workflow diagrams", run: ["bun", "run", "render:bpmn"] },
    // `needs: ["docs-pages"]`, and it is a REAL dependency rather than a
    // tidy-looking one: the state visualiser decides each graph's state by
    // asking whether `assets/<id>/index.json` is on disk, and `docs-pages` is
    // what writes it. Run the other way round, `beans` and `todos` render as
    // "declared" — wrong pages, exit 0, nothing to notice. Bean `flh4`.
    { id: "state-dashboards", needs: ["docs-pages"], fatal: false, label: "state graph dashboards", run: ["bun", "run", "cat-harness/scripts/state-visualizer.ts"] },

    // ── Stage 3: the dynamic state, after stage 2 has contributed ───────
    //
    // The owner named this *"cat-harness/state.jsonld or so (whatever matches
    // the dyanmic state vsualizesrs)"* — an explicit uncertainty, so the NAME
    // is not invented here. The step exists, its position is fixed, and what
    // it writes is settled when the dynamic-state visualisers say what they
    // read. Until then it re-exports the graph the stage-2 renderers have
    // contributed to, which is the one part of the description that is not in
    // question.
    {
      id: "kg-dynamic",
      needs: ["schema-docs", "skill-docs", "docs-pages", "bpmn"],
      fatal: true,
      label: "the DYNAMIC state, exported after the stage-2 renderers have contributed",
      run: ["bun", "run", "cat-harness/scripts/kg-export.ts", "--out", join(scratch, "state.jsonld")],
    },
  ];
}

export interface PipelineReport {
  text: string;
  exitCode: number;
}

export function runPipeline(repoRoot: string, opts: { dryRun?: boolean } = {}): PipelineReport {
  const scratch = mkdtempSync(join(tmpdir(), "render-pipeline-"));
  try {
    const steps = pipeline(scratch);
    const { order, problems } = flattenDependencies(steps);

    if (problems.length > 0) {
      // A broken graph is never partially run — see rule 3/4 in
      // `dependency-order.ts`. Reported as a failure of the PIPELINE
      // DECLARATION, which is a different defect from a step that failed.
      return {
        text: ["The render pipeline cannot be ordered:", ...problems.map((p) => `  ✗ ${p.detail}`)].join("\n"),
        exitCode: 2,
      };
    }

    if (opts.dryRun) {
      return {
        text: [
          "Render order (flattened from `needs`; ties break on declaration order):",
          ...order.map((s, i) => {
            const p = (s as RenderStep).pending === undefined ? "" : " [pending] ";
            return `  ${String(i + 1).padStart(2)}. ${s.id.padEnd(14)} ${s.fatal ? "FATAL " : "skip  "}${p}${s.label ?? ""}`;
          }),
        ].join("\n"),
        exitCode: 0,
      };
    }

    const pending: string[] = [];
    const { records, stopped } = runInOrder(order, (step) => {
      const s = step as RenderStep;
      if (s.pending !== undefined) {
        pending.push(`${s.id}: ${s.pending}`);
        return undefined;
      }
      if (s.run === undefined) return undefined;
      const r = spawnSync(s.run[0]!, s.run.slice(1), { cwd: repoRoot, stdio: "inherit" });
      if (r.error) return r.error.message;
      return r.status === 0 ? undefined : `exited ${r.status}`;
    });

    const out = ["Render pipeline:"];
    const isPending = (id: string): boolean => pending.some((p) => p.startsWith(`${id}: `));
    for (const r of records) {
      // PENDING is reported as its own mark, never as a tick: a declared step
      // that has no implementation and a step that ran clean must not read the
      // same in the report a person skims.
      const mark = isPending(r.step.id) ? "◻" : r.outcome === "ran" ? "✓" : r.outcome === "failed" ? "✗" : "–";
      const why = r.detail === undefined ? "" : ` — ${r.detail}`;
      out.push(`  ${mark} ${r.step.id}${why}`);
    }

    // A skipped step is reported as a SKIP and never as a pass: the whole
    // point of the cascade is that output which looks complete is not.
    const failed = records.filter((r) => r.outcome === "failed");
    const skipped = records.filter((r) => r.outcome === "skipped");
    out.push("");
    out.push(
      `${records.filter((r) => r.outcome === "ran").length} ran, ${failed.length} failed, ${skipped.length} skipped.`,
    );
    if (stopped !== undefined) {
      out.push(`STOPPED at \`${stopped}\` — a fatal step. Nothing after it was attempted.`);
      return { text: out.join("\n"), exitCode: 1 };
    }
    if (failed.length > 0) {
      out.push("Non-fatal failures: the renderings above are MISSING, not empty. Raise them as QA, not as a clean run.");
    }
    if (pending.length > 0) {
      out.push("");
      out.push("Declared but not yet performable:");
      for (const p of pending) out.push(`  ◻ ${p}`);
    }
    return { text: out.join("\n"), exitCode: 0 };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const repoRoot = repoRootFor(instanceRootFor(import.meta.dir));
  const report = runPipeline(repoRoot, { dryRun: process.argv.includes("--dry-run") });
  (report.exitCode === 0 ? console.log : console.error)(report.text);
  process.exit(report.exitCode);
}
