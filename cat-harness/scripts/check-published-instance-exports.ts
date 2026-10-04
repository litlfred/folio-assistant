#!/usr/bin/env bun
/**
 * check-published-instance-exports.ts — every foreign-instance export the
 * deploy actually runs must succeed, and must mint absolute `@id`s.
 *
 * ## Why this gate exists at all
 *
 * `docs-site.yml` failed on `main` for over two hours on 2026-09-21 and the
 * fast gate set was green through every one of those runs; several merges
 * landed against that green. The break was a single command —
 * `kg-export.ts --instance ./bootstrap` — that no gate ran, because the
 * gate set ran `kg-export` only for THIS instance. The export defect itself
 * is fixed (bean `40fl`); this gate is the part that was missing, and it is
 * the reason the outage was findable only from the forge.
 *
 * That is `xom7`'s finding one workflow over: a red workflow looks exactly
 * like a green one from a checkout. A gate is the only thing that makes the
 * deploy's own commands visible from inside a clone.
 *
 * ## The set is DERIVED, and from EVERY workflow — never listed here
 *
 * An array of instance paths is a second answer to "what does this repository
 * publish", free to disagree with the first the moment somebody edits the
 * YAML — and the disagreement would present as this gate passing while a
 * deploy breaks, which is that failure with an extra step. So the invocations
 * are read out of the workflow files themselves: add a `kg-export --instance`
 * line to any of them and it is covered here with no edit to this file.
 *
 * **`kg-export`'s, not every `--instance`** — see `INVOCATION` below for why
 * the anchor is deliberate. This sentence said "an `--instance` line to any of
 * them" until 2026-09-21, which was true while `kg-export` was the only script
 * taking the flag and stopped being true the moment `glossary-export.ts` took
 * it too. A second instance-scoped publisher is covered by its OWN gate
 * (`glossary:check:bootstrap`, which runs the same build), not by this one.
 *
 * **Every workflow, not a named pair.** The first version of this gate read
 * `docs-site.yml` alone, and `3jhq` measured what that missed:
 * `feature-staging.yml` published no site-root export at all, so a staged
 * cat-harness graph carried `$BASE/bootstrap.jsonld#skill/discussion`
 * pointing at a document that build never wrote — two dangling links on every
 * preview, invisible to a gate looking one file over. Naming the second file
 * would have fixed today and left the third to be discovered the same way.
 *
 * Same reasoning as `viewerSources()` replacing `VIEWER_SOURCES`, and as
 * `gates.ts` deriving its list from `code-quality-gates.yml`.
 *
 * ## An empty set is exit 2, not a pass
 *
 * If the regex stops matching — the command is renamed, the flag changes
 * spelling — this gate would examine nothing and report clean, which is the
 * failure it exists to prevent wearing a green tick. Nothing found is
 * "could not determine", and the third-state rule says that is never
 * rendered as clean.
 *
 * @module scripts/check-published-instance-exports
 * @covers cat-harness
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

// `declarationPathIn` only, deliberately: it answers "is there a declaration
// here" from the FILENAME convention and parses nothing, so this gate needs
// no graph-kind registered to ask. `readDeclaration` would, and a gate that
// throws on an unregistered kind reports a break it did not find.
import { declarationPathIn } from "../schemas/cat-harness.js";
import { againstRef, qaResultPath, qaResultState, readQaResult, type QaResultState } from "./qa-results.js";
import { readQaTree } from "./qa-store.js";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");
const WORKFLOW_DIR = join(REPO_ROOT, ".github", "workflows");
/** The instance whose `kg-export.*.qa-results.json` sidecars this gate compares. */
const QA_ROOT = join(REPO_ROOT, "cat-harness");
/** Where those sidecars live — the one composition, `qaResultPath`'s. */
const QA_DIR = dirname(qaResultPath(QA_ROOT, "x"));

/**
 * A base a workflow supplies through a shell variable cannot be run verbatim,
 * so a stand-in is substituted and the report says so.
 *
 * The VALUE does not change whether the export succeeds — only whether the
 * declaration fallback is exercised — so this is a weaker test than the
 * base-less invocation, not a different one. Saying which is which is the
 * point; silently running a command nobody runs is how a gate goes green over
 * a break.
 */
const PLACEHOLDER_BASE = "https://example.invalid/gate-stand-in";

/**
 * A `kg-export.ts --instance <path>` invocation inside the deploy workflow.
 *
 * Deliberately anchored on `kg-export.ts` rather than on `--instance` alone:
 * other scripts take an instance argument and are not this export, and a gate
 * that ran them would report failures that say nothing about the published
 * graph.
 */
const INVOCATION = /kg-export\.ts\s+--instance\s+(\S+)([^\n]*)/g;

/**
 * A content repository's OWN tools exporting its graph — bootstrap-tools'
 * `export-graph.ts --root <path>`, which writes `bootstrap.jsonld` since
 * 2026-09-30 (owner, bean `xsqm`). The same question as above — does the
 * command the deploy runs succeed, and emit something — for a publisher that
 * is not cat-harness's.
 */
const TOOLS_INVOCATION = /bootstrap-tools\/scripts\/export-graph\.ts\s+--root\s+(\S+)([^\n]*)/g;

export interface Invocation {
  /** The workflow file that runs it, basename only. */
  workflow: string;
  /** The instance path exactly as the workflow spells it. */
  instance: string;
  /** True when the workflow passes a `--base-url` this gate had to stand in for. */
  standInBase: boolean;
  /** Which exporter: cat-harness's, or the content's own tools'. */
  tool?: "kg-export" | "export-graph";
}

/**
 * Where an invocation came from. A workflow line is the deploy's own command.
 * A committed sidecar is a subject that only the comparison has, which
 * {@link committedSidecarSubjects} explains.
 */
export const COMMITTED_SIDECAR = "(committed sidecar)";

export interface ExportResult {
  /** The workflow file that runs it, basename only. */
  workflow: string;
  /** The instance path exactly as the workflow spells it. */
  instance: string;
  /** True when the workflow passes a `--base-url` this gate had to stand in for. */
  standInBase: boolean;
  /** Which exporter ran, carried from the invocation. */
  tool?: Invocation["tool"];
  /** Nodes the export emitted, when it said. Zero is a finding, not a pass. */
  nodes?: number;
  /** True when the export exited 0. */
  ok: boolean;
  /** Why it failed — the export's own stderr, trimmed to what it reported. */
  detail?: string;
  /**
   * The COMMITTED QA sidecar for this export, against the one this run computed.
   *
   * Bean `ymsu`. This gate used to publish that sidecar as a side effect of
   * verifying the export, which made it the only producer AND the only reader —
   * so it could not fail on a stale one. The export now writes to a temp root
   * and the committed copy is COMPARED instead.
   *
   * `undefined` is could-not-determine: the export did not run, or wrote no
   * sidecar to compare against. Never rendered as agreement.
   */
  qaSidecar?: QaResultState;
}

export interface PublishedExportReport {
  /** Invocations read out of every workflow, in the order found. */
  invocations: Invocation[];
  results: ExportResult[];
  /** Workflow files present but unreadable — a third state, never a pass. */
  unreadable?: string;
  /** How many workflow files were examined. Zero is a finding, not a clean run. */
  workflowsRead?: number;
  /**
   * Committed `kg-export.<stub>.qa-results.json` files that no workflow's
   * `kg-export.ts --instance` produces. Each one is re-exported and COMPARED,
   * so the committed file has a live reader. They are kept apart from
   * `invocations`, so a workflow pattern that stops matching is still reported
   * as "examined nothing". See {@link committedSidecarSubjects}.
   */
  sidecarSubjects?: Invocation[];
  /**
   * Why no committed sidecar could be LISTED, when none could — bean `id4s`.
   * The QA results directory not being in the checkout (QA leaves `main` for
   * the `qa-reports` branch) is not "there are no committed sidecars": the
   * comparison's subjects are unknown, and the report says so instead of
   * dropping the line.
   */
  sidecarSubjectsUnknown?: string;
  /** The `--against` ref the committed sidecars were read from, when one was given. */
  against?: string;
}

/**
 * The comparison's own subjects: every committed foreign-instance
 * `kg-export.<stub>.qa-results.json` that no workflow invocation covers.
 *
 * ## Why the gate needs subjects of its own (bean `r7v6`, C2)
 *
 * The comparison below (bean `ymsu`) ran only for a workflow `kg-export.ts
 * --instance` line. Since 2026-09-30 both deploy workflows publish bootstrap
 * through `bootstrap-tools`' `export-graph.ts`, which writes no QA sidecar. So
 * `fresh` was always `undefined`, the comparison never ran, and
 * `kg-export.bootstrap.qa-results.json` had no live reader. Measured: identical
 * output with the file present and absent. When re-exported, that committed
 * file turned out to be STALE: the producer's hash had changed, and so had the
 * untagged-module count.
 *
 * So the subjects are read from the committed files themselves, the same
 * derivation-over-listing rule this gate applies to workflows. A sidecar that
 * nothing produces is still compared, and it is reported as having no workflow
 * producer. Whether to keep it is a person's decision
 * (`deletion-requires-confirmation`).
 *
 * `qaStem` mirrors `kg-export.ts`: `kg-export.<basename of the instance>`, and
 * the host's own `kg-export.qa-results.json` carries no stub and is not a
 * foreign export.
 */
export function committedSidecarSubjects(covered: readonly Invocation[], qaDir: string = QA_DIR): Invocation[] {
  let names: string[];
  try {
    names = readdirSync(qaDir).map(String);
  } catch {
    return [];
  }
  return subjectsFrom(names, covered);
}

/**
 * {@link committedSidecarSubjects}, from wherever the committed sidecars are:
 * the working copy, or with `against` the `qa-reports` branch through
 * qa-store (bean `id4s`). Four states: a listing that could not be made is
 * `unknown` with its reason, never an empty list — an empty list would read
 * as "no sidecar to compare", which is the C2 shape this gate was fixed for.
 */
export function sidecarSubjectsFrom(
  covered: readonly Invocation[],
  opts: { against?: string; qaDir?: string } = {},
): { subjects: Invocation[]; unknown?: string } {
  const qaDir = opts.qaDir ?? QA_DIR;
  if (opts.against !== undefined) {
    const t = readQaTree(opts.against, qaDir);
    if (t.state !== "hit") return { subjects: [], unknown: `qa-reports:${opts.against} — ${t.state}: ${t.reason}` };
    return { subjects: subjectsFrom([...t.files.keys()].map((p) => basename(p)), covered) };
  }
  if (!existsSync(qaDir)) {
    return {
      subjects: [],
      unknown: `${qaDir.slice(REPO_ROOT.length + 1)} is not in this checkout — pass --against <ref> to compare the qa-reports copies`,
    };
  }
  return { subjects: committedSidecarSubjects(covered, qaDir) };
}

function subjectsFrom(names: readonly string[], covered: readonly Invocation[]): Invocation[] {
  const done = new Set(
    covered.filter((i) => (i.tool ?? "kg-export") === "kg-export").map((i) => instanceStub(i.instance)),
  );
  const out: Invocation[] = [];
  for (const n of [...names].sort()) {
    const m = /^kg-export\.(.+)\.qa-results\.json$/.exec(n);
    if (m === null || done.has(m[1]!)) continue;
    out.push({ workflow: COMMITTED_SIDECAR, instance: instancePathForStub(m[1]!), standInBase: false, tool: "kg-export" });
  }
  return out;
}

/**
 * The stub `kg-export` names an instance's sidecar with — the declaration's
 * `stub ?? name` (`artefactStub`), read RAW so this gate needs no graph kind
 * registered. It was `basename(path)`, which is the same answer for
 * `./bootstrap` and the wrong one for `.`: the checkout root's directory is
 * named after wherever it was cloned, while its stub is its declared name
 * (bean `l4ay`, which added the root's export to the deploy).
 */
export function instanceStub(instance: string): string {
  const abs = resolve(REPO_ROOT, instance);
  const p = declarationPathIn(abs);
  if (p !== undefined) {
    try {
      const d = JSON.parse(readFileSync(p, "utf-8")) as { name?: string; stub?: string };
      const s = d.stub ?? d.name;
      if (typeof s === "string" && s !== "") return s;
    } catch {
      // unreadable: fall back to the path, and the export itself will fail loudly
    }
  }
  return basename(abs);
}

/** The repository-relative instance path whose stub is `stub` — `.` for the checkout root, else `./<stub>`. */
function instancePathForStub(stub: string): string {
  return instanceStub(".") === stub ? "." : `./${stub}`;
}

/**
 * The invocations one workflow's text runs, in the order it runs them.
 *
 * `rest` is the remainder of that line, which is how `--base-url` is detected:
 * a workflow supplying one is testing a different command from a workflow
 * that does not, and the report must not present them as the same evidence.
 */
export function publishedInstances(workflowText: string, workflow = ""): Invocation[] {
  return [
    ...[...workflowText.matchAll(INVOCATION)].map((m) => ({
      workflow,
      instance: m[1]!,
      standInBase: /--base-url/.test(m[2] ?? ""),
      tool: "kg-export" as const,
    })),
    ...[...workflowText.matchAll(TOOLS_INVOCATION)].map((m) => ({
      workflow,
      instance: m[1]!,
      standInBase: true,
      tool: "export-graph" as const,
    })),
  ];
}

/**
 * Run one foreign export the way the deploy runs it — no `--base-url`.
 *
 * The missing flag is the point. The deploy passes none, on the declaration's
 * own authority, so a gate that supplied one would test a command nobody runs
 * and pass while the real one failed.
 */
/**
 * Nodes an export reported, from its own summary line, or `undefined`.
 *
 * Read from the export's output rather than by re-opening the file: the
 * question is what the command a workflow runs actually produced.
 */
function nodesEmitted(stdout: string): number | undefined {
  // kg-export's summary ends `<n> total`; export-graph's says `: <n> nodes`.
  const m = /^\s*(\d+)\s+total\s*$/m.exec(stdout) ?? /: (\d+) nodes\b/.exec(stdout);
  return m ? Number(m[1]) : undefined;
}

function runExport(inv: Invocation, outDir: string, against?: string): ExportResult {
  // ── EXIT 0 IS NOT ENOUGH, and the falsification is what proved it ───────
  //
  // Pointing an invocation at `./no-such-instance` exited 0 and this gate
  // reported a tick. With a `--base-url` supplied the missing declaration
  // costs nothing — the stub falls back, the `@id` is absolute, no source is
  // reported unread — and the export publishes an EMPTY graph under a name a
  // consumer trusts. That is `dh4f`: a clean run over a corpus the tool could
  // not read, in the gate written to stop exactly that class.
  //
  // So the path is checked before the command runs, and the node count after.
  const abs = resolve(REPO_ROOT, inv.instance);
  if (!existsSync(abs)) {
    return { ...inv, ok: false, detail: `instance path does not exist: ${inv.instance}` };
  }
  // AND IT MUST BE A DECLARED INSTANCE. "0 nodes" is too weak to discriminate
  // a wrong path: pointing this at `./.github` produced 28 nodes, because the
  // generic collectors read the repository regardless of what the argument
  // names. So the question asked is the one the repository already answers
  // everywhere else — declaration over location. Without it the export mints
  // a stub from `package.json` and publishes somebody else's content under
  // the wrong instance's name.
  if (declarationPathIn(abs) === undefined) {
    return {
      ...inv,
      ok: false,
      detail: `${inv.instance} declares no instance — no \`<name>.json\` whose stem matches its declared name`,
    };
  }
  const stub = `${inv.workflow}-${inv.instance}`.replace(/[^a-zA-Z0-9]+/g, "-");
  const args =
    inv.tool === "export-graph"
      ? ["run", join("bootstrap-tools", "scripts", "export-graph.ts"), "--root", inv.instance, "--base-url", `${PLACEHOLDER_BASE}/instance/`]
      : ["run", join("cat-harness", "scripts", "kg-export.ts"), "--instance", inv.instance];
  // Only when the workflow passes one. Supplying a base where the workflow
  // does not would skip the declaration fallback entirely — the exact path
  // that broke the deploy — and report a pass over it. (export-graph always
  // takes one: it has no fallback to skip.)
  if (inv.tool !== "export-graph" && inv.standInBase) args.push("--base-url", PLACEHOLDER_BASE);
  args.push("--out", join(outDir, `${stub}.jsonld`));
  // ── AND the sidecar, which `--out` never governed (bean `ymsu`) ──────────
  //
  // `kg-export.ts` writes two artefacts: the document, sent to `outDir` above,
  // and a COMMITTED QA sidecar under `<instance>/test/results/`. This gate runs
  // it with `cwd: REPO_ROOT`, so that second write landed in the tree being
  // judged — and because this gate is the only thing that ever exports
  // `--instance ./bootstrap`, it was the sole producer of
  // `test/results/kg-export.bootstrap.qa-results.json` and therefore the only
  // thing that could repair it.
  //
  // Measured on `origin/main` `e718627f198`, this gate alone on an otherwise
  // CLEAN tree: exit **0**, and `kg-export.bootstrap.qa-results.json` comes
  // back ` M` with `script_hash` corrected from the committed `b539167517cb` to
  // the true `0456470f68c8`. So `main` was carrying a stale recorded hash, the
  // gate that reads it passed, and the only thing that noticed was the runner's
  // mutation guard — this bean's third symptom: every verdict green, exit 1.
  //
  // Verifying an export must not be how the export gets published.
  args.push("--qa-root", outDir);

  const r = spawnSync("bun", args, { cwd: REPO_ROOT, encoding: "utf-8" });
  const nodes = nodesEmitted(r.stdout ?? "");
  // The sidecar the export just computed, read back out of the temp root and
  // compared with the committed one. `qaStem` mirrors `kg-export.ts`'s own
  // rule: the HOST keeps the bare stem, a foreign instance is qualified by its
  // stub. Composed here rather than parsed out of the export's output, because
  // a gate that reads a path off stdout breaks when a log line is reworded.
  const qaStem = `kg-export.${instanceStub(inv.instance)}`;
  // ONLY for a kg-export row (bean `0utt`). Every invocation shares `outDir`,
  // so an `export-graph` row — which writes no sidecar — read the one a
  // kg-export row had just written there and reported "QA sidecar current"
  // for a comparison it never made. Latent while the kg-export row came LAST
  // (it was only ever the committed-sidecar subject); exposed the moment a
  // workflow line producing that sidecar sorted ahead of the deploys.
  const fresh = (inv.tool ?? "kg-export") === "kg-export" ? readQaResult(qaResultPath(outDir, qaStem)) : undefined;
  // Through qa-store's four states (bean `id4s`): the working copy, or the
  // `qa-reports` branch with `--against`.
  const qaSidecar = fresh === undefined ? undefined : qaResultState(qaResultPath(QA_ROOT, qaStem), fresh, { against });
  if (r.status === 0) {
    // A published graph with no nodes is not a graph. Reported as a failure
    // rather than a note: the deploy would write it, and a consumer cannot
    // tell an empty document from one whose subjects were never collected.
    if (nodes === 0) {
      return { ...inv, nodes, ok: false, qaSidecar, detail: "exported 0 nodes — an empty graph published under a name a consumer trusts" };
    }
    // `kg-export.ts` ALWAYS writes a sidecar under `--qa-root`. If it wrote
    // none, nothing was compared. That is could-not-determine, and it must
    // not share an exit with agreement (bean `r7v6`, C2). `export-graph.ts`
    // writes no sidecar by design, so that row has nothing to compare.
    if ((inv.tool ?? "kg-export") === "kg-export" && fresh === undefined) {
      return {
        ...inv,
        nodes,
        ok: false,
        detail:
          `the export wrote no \`${qaStem}.qa-results.json\` under its --qa-root, so the committed one was ` +
          "NOT compared. That is could-not-determine, not agreement",
      };
    }
    // A STALE committed sidecar is a failure of this gate, and that placement
    // is deliberate rather than convenient: nothing else in the gate set
    // produces or reads `kg-export.<stub>.qa-results.json`, so if this gate
    // waves it through, no gate ever looks at it. Measured on `origin/main`
    // `e718627f198` — the committed hash was `b539167517cb` against a true
    // `0456470f68c8`, and every verdict in the run was green.
    //
    // `absent`, `unreadable` and `unknown` are NOT failures any more (bean
    // `id4s`): once QA results leave `main` a committed copy is absent by
    // design, and proposal §2.3 rules a missing baseline `unknown` — reported,
    // never a pass, not this change's defect. They still never share a line
    // with agreement: the row carries the state and the report prints it.
    if (qaSidecar === "stale") {
      return {
        ...inv,
        nodes,
        qaSidecar,
        ok: false,
        detail:
          `the committed \`${qaStem}.qa-results.json\` is ${qaSidecar.toUpperCase()} against this export — ` +
          "this gate no longer rewrites it on its way past (bean `ymsu`). Run " +
          `\`bun run cat-harness/scripts/kg-export.ts --instance ${inv.instance}\` and commit the result`,
      };
    }
    return { ...inv, nodes, ok: true, qaSidecar };
  }
  // The export prints its problems to stdout and exits non-zero; stderr
  // carries a crash. Both are reported, because "it failed and said nothing"
  // must not read the same as "it failed for this reason".
  const said = [r.stdout, r.stderr]
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .join("\n")
    .split("\n")
    .filter((l) => l.includes("\u2717") || l.includes("error"))
    .join("\n")
    .trim();
  return { ...inv, nodes, ok: false, qaSidecar, detail: said || `exited ${String(r.status)} with no diagnosis` };
}

export function checkPublishedInstanceExports(opts: { against?: string } = {}): PublishedExportReport {
  let files: string[];
  try {
    files = readdirSync(WORKFLOW_DIR)
      .map(String)
      .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
      .sort();
  } catch (e) {
    return {
      invocations: [],
      results: [],
      unreadable: `${WORKFLOW_DIR} could not be listed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const invocations: Invocation[] = [];
  const unreadable: string[] = [];
  for (const f of files) {
    const abs = join(WORKFLOW_DIR, f);
    if (!existsSync(abs)) continue;
    let text: string;
    try {
      text = readFileSync(abs, "utf-8");
    } catch (e) {
      // A workflow present but unreadable is NOT "no invocations here": it is
      // a file this gate could not judge, and reporting it as clean is the
      // third-state failure the whole check exists to refuse.
      unreadable.push(`${f}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    invocations.push(...publishedInstances(text, f));
  }

  const base: PublishedExportReport = {
    invocations,
    results: [],
    workflowsRead: files.length - unreadable.length,
    ...(unreadable.length > 0 ? { unreadable: unreadable.join("; ") } : {}),
  };
  if (invocations.length === 0) return base;

  const { subjects: sidecarSubjects, unknown } = sidecarSubjectsFrom(invocations, { against: opts.against });
  const outDir = mkdtempSync(join(tmpdir(), "published-instance-export-"));
  try {
    return {
      ...base,
      sidecarSubjects,
      ...(unknown !== undefined ? { sidecarSubjectsUnknown: unknown } : {}),
      ...(opts.against !== undefined ? { against: opts.against } : {}),
      results: [...invocations, ...sidecarSubjects].map((i) => runExport(i, outDir, opts.against)),
    };
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

export function formatReport(r: PublishedExportReport): string {
  const out: string[] = [];
  if (r.invocations.length === 0) {
    out.push("Published instance exports");
    if (r.unreadable !== undefined) {
      out.push(`  ? COULD NOT READ ${r.unreadable}. That is not a pass.`);
      return out.join("\n");
    }
    out.push("  ? EXAMINED NOTHING — no `kg-export.ts --instance` invocation found in");
    out.push(`    any of ${String(r.workflowsRead ?? 0)} workflow file(s). Either nothing publishes a`);
    out.push("    foreign instance's graph any more, or this gate's pattern stopped");
    out.push("    matching it. Both are findings; neither is a pass.");
    return out.join("\n");
  }

  const workflows = new Set(r.invocations.map((i) => i.workflow));
  const orphans = r.sidecarSubjects ?? [];
  out.push(
    `Published instance exports (${r.invocations.length} invocation(s) across ` +
      `${workflows.size} workflow(s), of ${String(r.workflowsRead ?? 0)} read` +
      (orphans.length > 0 ? `; ${orphans.length} committed sidecar(s) compared` : "") +
      ")",
  );
  if (r.unreadable !== undefined) {
    // Reported ABOVE the results, and it outranks them: a sweep blind on one
    // file has not cleared the others.
    out.push(`  ? COULD NOT READ ${r.unreadable}. The results below are partial.`);
  }

  const failed = r.results.filter((x) => !x.ok);
  for (const x of r.results) {
    const counted = x.nodes === undefined ? "" : ` — ${String(x.nodes)} node(s)`;
    const sidecar =
      x.qaSidecar !== undefined
        ? `; QA sidecar ${x.qaSidecar}`
        : x.tool === "export-graph"
          ? "; writes no QA sidecar"
          : "";
    const note = (x.standInBase ? "  (its `--base-url` stood in)" : "") + counted + sidecar;
    if (x.ok && x.qaSidecar !== undefined && x.qaSidecar !== "current") {
      out.push(`  ✓ ${x.workflow}: ${x.instance}${note}`);
      out.push(
        `      ? UNKNOWN — no ${r.against ? `qa-reports:${r.against}` : "committed"} baseline to compare its sidecar with ` +
          `(${x.qaSidecar}). NOT "current", and not gated (bean id4s, proposal §2.3)`,
      );
      continue;
    }
    if (x.ok) {
      out.push(`  ✓ ${x.workflow}: ${x.instance}${note}`);
      continue;
    }
    out.push(`  ✗ ${x.workflow}: ${x.instance}${note}`);
    for (const line of (x.detail ?? "").split("\n")) out.push(`      ${line.trim()}`);
  }

  if (r.sidecarSubjectsUnknown !== undefined) {
    // Said, never dropped: before bean `id4s` an absent results directory made
    // the "committed sidecar(s) compared" line vanish while the gate exited 0.
    out.push(`  ? UNKNOWN — the committed kg-export sidecars could not be listed: ${r.sidecarSubjectsUnknown}. Their comparison was NOT made`);
  }
  if (orphans.length > 0) {
    // Reported, never deleted: no workflow produces these, so whether they are
    // kept is the owner's call (`deletion-requires-confirmation`).
    out.push(
      `    no workflow runs \`kg-export.ts --instance\` for ${orphans.map((o) => o.instance).join(", ")}: ` +
        "its committed sidecar is compared here, but only a manual run produces it. Keeping it is a person's decision",
    );
  }
  if (failed.length === 0 && r.unreadable === undefined) {
    out.push("    every graph a workflow publishes builds, with dereferenceable `@id`s");
    return out.join("\n");
  }
  if (failed.length === 0) return out.join("\n");

  out.push("");
  out.push("  These are the commands the workflows run, run the way they run them. A");
  out.push("  failure here is that publish already broken — it will not be caught later");
  out.push("  by anything else in this gate set, which is how one such break survived");
  out.push("  several merges on 2026-09-21 with every local gate green.");
  out.push("");
  out.push("  An instance publishing into THIS repository's site inherits the publishing");
  out.push("  instance's base — see `exportIdentity` in `kg-export.ts` for that rule.");
  return out.join("\n");
}

if (import.meta.main) {
  let against: string | undefined;
  try {
    against = againstRef(process.argv.slice(2));
  } catch (e) {
    console.error(`check:published-instance-exports: ${(e as Error).message}`);
    process.exit(2);
  }
  const report = checkPublishedInstanceExports({ against });
  const clean =
    report.unreadable === undefined &&
    report.invocations.length > 0 &&
    report.results.every((x) => x.ok);
  (clean ? console.log : console.error)(formatReport(report));
  process.exit(clean ? 0 : 1);
}
