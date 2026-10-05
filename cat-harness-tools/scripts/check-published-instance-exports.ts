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
import { basename, dirname, join, relative, resolve } from "node:path";

// `declarationPathIn` only, deliberately: it answers "is there a declaration
// here" from the FILENAME convention and parses nothing, so this gate needs
// no graph-typology registered to ask. `readDeclaration` would, and a gate that
// throws on an unregistered kind reports a break it did not find.
import { declarationPathIn } from "../../cat-harness/schemas/cat-harness.js";
import { againstRef, qaResultPath, qaResultState, readQaResult, type QaResultState } from "../../cat-harness/scripts/qa-results.js";
import { readQaTree } from "../../cat-harness/scripts/qa-store.js";
import { PUBLISHED_ELSEWHERE, declaredInstanceStubs, instanceExportPlan, type PlannedExport } from "../../cat-harness/scripts/instance-exports.js";
import { publishedInstanceSchemas, scannedInstanceSchemas } from "../../cat-harness/scripts/kg-export.js";
import {
  PUBLIC_SCHEMA_EXPORT,
  instanceZodSchemaDirs,
  zodSchemaPath,
  type InstanceSchemaExport,
} from "../../cat-harness/scripts/harness-schema-export.js";
import { isZodSchema } from "../../cat-harness/schemas/kind-validator.js";
import { isExternalContract, skillContracts } from "../../cat-harness/scripts/skill-contracts.js";
import { termIri } from "../../cat-harness/schemas/namespaces.js";

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

/**
 * `instance-exports.ts --out-dir` — the DERIVED publisher (bean `4ak5`): one
 * line that runs `kg-export --instance` for every declared instance not
 * published elsewhere. Expanded into one invocation per planned instance, so
 * each is run and its committed sidecar compared exactly as a literal line's.
 */
const PLAN_INVOCATION = /instance-exports\.ts\s+--out-dir\s+\S+([^\n]*)/g;

/** The deploy: completeness is required of the site it builds (bean `4ak5` item 5). */
export const DEPLOY_WORKFLOW = "docs-site.yml";

export interface Invocation {
  /** The workflow file that runs it, basename only. */
  workflow: string;
  /** The instance path exactly as the workflow spells it. */
  instance: string;
  /** True when the workflow passes a `--base-url` this gate had to stand in for. */
  standInBase: boolean;
  /** Which exporter: cat-harness's, or the content's own tools'. */
  tool?: "kg-export" | "export-graph";
  /**
   * Expanded from an `instance-exports.ts` line, so the deploy also writes this
   * instance a `<stub>/schema/` directory and links it (bean `4ak5` item 1).
   */
  planned?: boolean;
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
   * Bean `4ak5` item 5: declared instances a publishing workflow leaves with
   * no export. Each entry names the workflow and why. Non-empty is a failure.
   */
  incomplete?: string[];
  /**
   * Bean `4ak5` item 1: contracts a planned instance's skills name that the
   * publisher would not write into its `<stub>/schema/`. Non-empty is a failure.
   */
  unpublishedSchemas?: string[];
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
 * `stub ?? name` (`artefactStub`), read RAW so this gate needs no graph typology
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
export function publishedInstances(
  workflowText: string,
  workflow = "",
  plan: () => readonly PlannedExport[] = () => instanceExportPlan(REPO_ROOT),
): Invocation[] {
  const planned = [...workflowText.matchAll(PLAN_INVOCATION)].flatMap((m) =>
    plan().map((p) => ({
      workflow,
      instance: p.path,
      // The publisher passes no base to an instance with its own canonical URL.
      standInBase: /--base-url/.test(m[1] ?? "") && !p.ownCanonical,
      tool: "kg-export" as const,
      planned: true,
    })),
  );
  return [
    ...planned,
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
  // The committed sidecar describes the DEPLOY's export, which passes no base.
  // Its findings name nodes by absolute IRI, so a stand-in base can never
  // agree with it: measured 2026-10-04, `folio-assistant-core` and
  // `smart-base` came out STALE under the stand-in and CURRENT without one.
  // So a stand-in run builds and counts the document and does not compare;
  // the base-less invocation of the same instance is the one that does
  // (bean `4ak5`).
  const compares = !inv.standInBase;
  // ONLY for a kg-export row (bean `0utt`). Every invocation shares `outDir`,
  // so an `export-graph` row — which writes no sidecar — read the one a
  // kg-export row had just written there and reported "QA sidecar current"
  // for a comparison it never made. Latent while the kg-export row came LAST
  // (it was only ever the committed-sidecar subject); exposed the moment a
  // workflow line producing that sidecar sorted ahead of the deploys.
  const fresh = (inv.tool ?? "kg-export") === "kg-export" ? readQaResult(qaResultPath(outDir, qaStem)) : undefined;
  // Through qa-store's four states (bean `id4s`): the working copy, or the
  // `qa-reports` branch with `--against`.
  const qaSidecar = fresh === undefined || !compares ? undefined : qaResultState(qaResultPath(QA_ROOT, qaStem), fresh, { against });
  if (r.status === 0) {
    // A published graph with no nodes is not a graph. Reported as a failure
    // rather than a note: the deploy would write it, and a consumer cannot
    // tell an empty document from one whose subjects were never collected.
    if (nodes === 0) {
      return { ...inv, nodes, ok: false, qaSidecar, detail: "exported 0 nodes — an empty graph published under a name a consumer trusts" };
    }
    // ── THE SCHEMA HALF (bean `4ak5` item 1) ────────────────────────────
    //
    // A planned instance's document must link the index the deploy writes for
    // it, and must list no public `Schema` node the publisher would leave
    // out. The second is a standing tripwire, not a present failure: the
    // schema-node collector is instance-bound (`COLLECTOR_SCOPE`), so no
    // foreign export lists one today. The index renders Zod schemas per
    // EXPORT under `zod/` (owner ruling 2026-10-05), but a Schema node names a
    // MODULE, and nothing maps one to the other yet — so the day an export
    // lists nodes, they would point at nothing. This fails then.
    if (inv.planned === true) {
      const gap = schemaLinkGap(inv, join(outDir, `${stub}.jsonld`));
      if (gap !== undefined) return { ...inv, nodes, ok: false, qaSidecar, detail: gap };
    }
    // `kg-export.ts` ALWAYS writes a sidecar under `--qa-root`. If it wrote
    // none, nothing was compared. That is could-not-determine, and it must
    // not share an exit with agreement (bean `r7v6`, C2). `export-graph.ts`
    // writes no sidecar by design, so that row has nothing to compare.
    if ((inv.tool ?? "kg-export") === "kg-export" && compares && fresh === undefined) {
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

/**
 * Why a planned instance's exported document disagrees with the schema
 * directory the deploy writes for it, or `undefined` when it agrees.
 *
 * Built with the base the deploy would pass, so the comparison is between the
 * two artefacts ONE run produces — `kg-export`'s `conformsTo` and
 * `instance-exports.ts`'s index `$id` — through the one composition both use
 * (`publishedInstanceSchemas`).
 */
function schemaLinkGap(inv: Invocation, docPath: string): string | undefined {
  let doc: { conformsTo?: unknown; "@graph"?: Array<Record<string, unknown>> };
  try {
    doc = JSON.parse(readFileSync(docPath, "utf-8")) as typeof doc;
  } catch (e) {
    return `could not read the exported document to compare its schema link: ${e instanceof Error ? e.message : String(e)}`;
  }
  const built = publishedInstanceSchemas(resolve(REPO_ROOT, inv.instance), inv.standInBase ? PLACEHOLDER_BASE : undefined);
  if (doc.conformsTo !== built.indexIri) {
    return (
      `its document links schema index ${JSON.stringify(doc.conformsTo ?? null)}, but the deploy writes ` +
      `${JSON.stringify(built.indexIri ?? null)} — the link and the file must come from one identity`
    );
  }
  const schemaType = termIri("Schema");
  const listed = (doc["@graph"] ?? []).filter((n) => n["@type"] === schemaType || (Array.isArray(n["@type"]) && n["@type"].includes(schemaType)));
  if (listed.length > 0) {
    return (
      `its graph lists ${listed.length} public Schema node(s) (${listed.map((n) => String(n.name ?? n["@id"])).join(", ")}), ` +
      "and the index maps no Schema NODE (a module) to its renderings — `zod/` is keyed by export, not by node. " +
      "Link the nodes to their renderings before publishing them"
    );
  }
  return undefined;
}

/**
 * Bean `4ak5` item 1 — does every contract a planned instance's skills NAME
 * reach its published `<stub>/schema/`?
 *
 * The two sides are read independently on purpose. What the instance HAS is
 * its own skills' `input:` / `output:` refs (`skillContracts`, instance
 * scope, external IRIs aside); what the publisher WRITES is
 * `publishedInstanceSchemas`, the function `instance-exports.ts` calls. A
 * check that read the contract directory for both would agree with itself
 * whatever the publisher did — the failure this repository keeps naming.
 *
 * `publish` is injectable so a test can stand in a publisher that drops a
 * contract and watch this fail; the default is the deploy's own.
 */
export function unpublishedInstanceSchemas(
  plan: readonly PlannedExport[] = instanceExportPlan(REPO_ROOT),
  publish: (instanceRoot: string) => InstanceSchemaExport = (r) => publishedInstanceSchemas(r),
  repo: string = REPO_ROOT,
): string[] {
  const out: string[] = [];
  const norm = (p: string): string => p.split("\\").join("/");
  for (const p of plan) {
    const root = resolve(repo, p.path);
    const built = publish(root);
    if (!built.files.some(([f]) => f === `${p.stub}.schema.json`)) {
      out.push(`${p.path}: the publisher writes no \`${p.stub}/schema/${p.stub}.schema.json\` index`);
    }
    const written = new Set(built.contracts.map((c) => norm(c.source)));
    for (const c of skillContracts(root, "instance").values()) {
      if (resolve(c.instanceRoot) !== root) continue; // a skill held higher up publishes with its own instance
      for (const ref of [c.input, c.output]) {
        if (ref === undefined || isExternalContract(ref)) continue;
        if (!written.has(norm(ref))) {
          out.push(`${p.path}: skill \`${c.skill}\` names contract ${ref}, which the publisher does not write into ${p.stub}/schema/`);
        }
      }
    }
  }
  return out;
}

/**
 * A top-level `export const <Name>Schema` in a module's TEXT — the gate's own
 * reading of what a module exports, independent of the publisher's import walk.
 * The suffix is {@link PUBLIC_SCHEMA_EXPORT}'s; the declaration form is not
 * shared with anything, on purpose.
 */
const EXPORTED_CONST = /^export\s+const\s+([A-Za-z_$][\w$]*)\s*[:=]/gm;

/**
 * Bean `4ak5` item 1, part 2 — does every public Zod schema a planned
 * instance HAS reach its published `<stub>/schema/zod/`?
 *
 * The rule is the owner's (2026-10-05, option C, "every exported *Schema"):
 * every exported const named `*Schema` whose value is a Zod schema, in the
 * top-level `.ts` modules (not `*.test.ts`) of the instance's schemas
 * directory. What the instance HAS is read here from the modules' text — each
 * `export const …Schema` — and then confirmed a Zod value by importing the
 * module (`isZodSchema`, the repository's one answer to "is this Zod"). What
 * the publisher WRITES is {@link scannedInstanceSchemas}, the function the
 * deploy calls. The two halves enumerate independently: a scan that lost a
 * module, or a renderer that dropped an export, disagrees with the text.
 *
 * A non-Zod `*Schema` export is not public by the rule and is not a finding.
 * A module the gate cannot import, a publisher that did not scan, and every
 * failure the publisher reports (`zodProblems`) ARE findings: the deploy
 * exits 1 on the same, so the gate that passes it must too.
 *
 * Re-exports (`export { X } from`) are not seen by the text half, so this
 * guards against UNDER-publishing what a module declares, not against
 * publishing more. `publish` is injectable so a test can stand in a publisher
 * that drops one and watch this fail.
 */
export async function unpublishedZodSchemas(
  plan: readonly PlannedExport[] = instanceExportPlan(REPO_ROOT),
  publish: (instanceRoot: string) => Promise<InstanceSchemaExport> = (r) => scannedInstanceSchemas(r),
  repo: string = REPO_ROOT,
): Promise<string[]> {
  const out: string[] = [];
  for (const p of plan) {
    const root = resolve(repo, p.path);
    const has: Array<{ module: string; path: string }> = [];
    let dirs: string[];
    try {
      dirs = instanceZodSchemaDirs(root);
    } catch (e) {
      out.push(`${p.path}: its schemas directory could not be resolved, so its public Zod schemas are unknown: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    for (const dir of dirs) {
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir).map(String).sort()) {
        if (!f.endsWith(".ts") || f.endsWith(".test.ts") || f.endsWith(".d.ts")) continue;
        const module = relative(root, join(dir, f)).split("\\").join("/");
        const names = [...readFileSync(join(dir, f), "utf-8").matchAll(EXPORTED_CONST)]
          .map((m) => m[1]!)
          .filter((n) => PUBLIC_SCHEMA_EXPORT.test(n));
        if (names.length === 0) continue;
        let mod: Record<string, unknown>;
        try {
          mod = (await import(join(dir, f))) as Record<string, unknown>;
        } catch (e) {
          out.push(`${p.path}: ${module} declares ${names.join(", ")} but could not be imported: ${e instanceof Error ? e.message : String(e)}`);
          continue;
        }
        for (const n of names) {
          if (isZodSchema(mod[n])) has.push({ module: `${module}#${n}`, path: zodSchemaPath(basename(f, ".ts"), n) });
        }
      }
    }
    const built = await publish(root);
    if (!built.zodScanned) {
      out.push(`${p.path}: the publisher did not scan its public Zod schemas, so its index still says \`omitted: ["schemas"]\``);
    }
    for (const line of built.zodProblems) out.push(`${p.path}: ${line}`);
    const written = new Set(built.files.map(([f]) => f.split("\\").join("/")));
    const index = built.files.find(([f]) => f === `${p.stub}.schema.json`)?.[1];
    const listed = new Set(Object.keys((index?.$defs as Record<string, unknown> | undefined) ?? {}));
    for (const h of has) {
      if (!written.has(h.path)) {
        out.push(`${p.path}: ${h.module} is an exported Zod *Schema, which the publisher does not write to ${p.stub}/schema/${h.path}`);
      } else if (!listed.has(h.path.replace(/\.schema\.json$/, ""))) {
        out.push(`${p.path}: ${h.module} is written to ${p.stub}/schema/${h.path} but the index does not list it in \`$defs\``);
      }
    }
  }
  return out;
}

/** A workflow's text with its comment lines removed, so prose naming a command is not the command. */
function commands(text: string): string {
  return text
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");
}

/**
 * Bean `4ak5` item 5 — does every declared instance get a graph?
 *
 * The planned set is complete by construction, so what can go wrong is at its
 * edges, and each edge is asked here:
 *
 * - the DEPLOY must run the derived publisher at all, or the site carries
 *   only the instances somebody wrote a line for — the state this bean found;
 * - every workflow that runs it must also run each exempt instance's own
 *   publisher ({@link PUBLISHED_ELSEWHERE}), or the exemption outlives its
 *   reason and the instance is published by nobody;
 * - an exemption must name a DECLARED instance, or it exempts nothing and
 *   hides a rename.
 */
export function incompleteExports(
  workflows: ReadonlyMap<string, string>,
  declaredStubs: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  const running = [...workflows].filter(([, t]) => new RegExp(PLAN_INVOCATION.source).test(commands(t)));
  if (!running.some(([f]) => f === DEPLOY_WORKFLOW)) {
    out.push(
      `${DEPLOY_WORKFLOW} does not run \`instance-exports.ts --out-dir\`: the site publishes only the instances a workflow line names`,
    );
  }
  for (const [f, text] of running) {
    for (const [stub, e] of Object.entries(PUBLISHED_ELSEWHERE)) {
      if (!e.publisher.test(commands(text))) {
        out.push(`${f}: \`${stub}\` is exempt from instance-exports.ts (${e.why}) but this workflow runs no publisher for it`);
      }
    }
  }
  for (const stub of Object.keys(PUBLISHED_ELSEWHERE)) {
    if (!declaredStubs.has(stub)) out.push(`PUBLISHED_ELSEWHERE names \`${stub}\`, which no instance in this checkout declares`);
  }
  return out;
}

export async function checkPublishedInstanceExports(opts: { against?: string } = {}): Promise<PublishedExportReport> {
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
  const texts = new Map<string, string>();
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
    texts.set(f, text);
    invocations.push(...publishedInstances(text, f));
  }
  const declaredStubs = declaredInstanceStubs(REPO_ROOT);
  const incomplete = incompleteExports(texts, declaredStubs);
  // Only when a workflow runs the plan: with no plan line nothing writes a
  // schema directory, and `incomplete` already says the deploy is short.
  // The public Zod schemas (part 2, owner ruling 2026-10-05) share the line:
  // either half missing is the same failure — the deploy's `schema/` is short.
  const unpublishedSchemas = invocations.some((i) => i.planned === true)
    ? [...unpublishedInstanceSchemas(), ...(await unpublishedZodSchemas())]
    : [];

  const base: PublishedExportReport = {
    invocations,
    results: [],
    workflowsRead: files.length - unreadable.length,
    ...(unreadable.length > 0 ? { unreadable: unreadable.join("; ") } : {}),
    ...(incomplete.length > 0 ? { incomplete } : {}),
    ...(unpublishedSchemas.length > 0 ? { unpublishedSchemas } : {}),
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

  for (const line of r.incomplete ?? []) out.push(`  ✗ NOT EXPORTED — ${line}`);
  for (const line of r.unpublishedSchemas ?? []) out.push(`  ✗ SCHEMA NOT PUBLISHED — ${line}`);

  const failed = r.results.filter((x) => !x.ok);
  for (const x of r.results) {
    const counted = x.nodes === undefined ? "" : ` — ${String(x.nodes)} node(s)`;
    const sidecar =
      x.qaSidecar !== undefined
        ? `; QA sidecar ${x.qaSidecar}`
        : x.tool === "export-graph"
          ? "; writes no QA sidecar"
          : x.standInBase
            ? "; QA sidecar not compared (it describes the base-less deploy)"
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
  if (failed.length === 0 && r.unreadable === undefined && (r.incomplete ?? []).length === 0 && (r.unpublishedSchemas ?? []).length === 0) {
    out.push("    every declared instance is published, and every graph a workflow publishes builds, with dereferenceable `@id`s");
    out.push(
      "    every planned instance's contracts and exported Zod `*Schema` consts reach its `<stub>/schema/`, and its document links that index",
    );
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
  const report = await checkPublishedInstanceExports({ against });
  const clean =
    report.unreadable === undefined &&
    report.invocations.length > 0 &&
    (report.incomplete ?? []).length === 0 &&
    (report.unpublishedSchemas ?? []).length === 0 &&
    report.results.every((x) => x.ok);
  (clean ? console.log : console.error)(formatReport(report));
  process.exit(clean ? 0 : 1);
}
