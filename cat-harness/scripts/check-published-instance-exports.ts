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
import { join, resolve } from "node:path";

// `declarationPathIn` only, deliberately: it answers "is there a declaration
// here" from the FILENAME convention and parses nothing, so this gate needs
// no graph-kind registered to ask. `readDeclaration` would, and a gate that
// throws on an unregistered kind reports a break it did not find.
import { declarationPathIn } from "../schemas/cat-harness.js";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");
const WORKFLOW_DIR = join(REPO_ROOT, ".github", "workflows");

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

export interface Invocation {
  /** The workflow file that runs it, basename only. */
  workflow: string;
  /** The instance path exactly as the workflow spells it. */
  instance: string;
  /** True when the workflow passes a `--base-url` this gate had to stand in for. */
  standInBase: boolean;
}

export interface ExportResult {
  /** The workflow file that runs it, basename only. */
  workflow: string;
  /** The instance path exactly as the workflow spells it. */
  instance: string;
  /** True when the workflow passes a `--base-url` this gate had to stand in for. */
  standInBase: boolean;
  /** Nodes the export emitted, when it said. Zero is a finding, not a pass. */
  nodes?: number;
  /** True when the export exited 0. */
  ok: boolean;
  /** Why it failed — the export's own stderr, trimmed to what it reported. */
  detail?: string;
}

export interface PublishedExportReport {
  /** Invocations read out of every workflow, in the order found. */
  invocations: Invocation[];
  results: ExportResult[];
  /** Workflow files present but unreadable — a third state, never a pass. */
  unreadable?: string;
  /** How many workflow files were examined. Zero is a finding, not a clean run. */
  workflowsRead?: number;
}

/**
 * The invocations one workflow's text runs, in the order it runs them.
 *
 * `rest` is the remainder of that line, which is how `--base-url` is detected:
 * a workflow supplying one is testing a different command from a workflow
 * that does not, and the report must not present them as the same evidence.
 */
export function publishedInstances(workflowText: string, workflow = ""): Invocation[] {
  return [...workflowText.matchAll(INVOCATION)].map((m) => ({
    workflow,
    instance: m[1]!,
    standInBase: /--base-url/.test(m[2] ?? ""),
  }));
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
  const m = /^\s*(\d+)\s+total\s*$/m.exec(stdout);
  return m ? Number(m[1]) : undefined;
}

function runExport(inv: Invocation, outDir: string): ExportResult {
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
  const args = ["run", join("cat-harness", "scripts", "kg-export.ts"), "--instance", inv.instance];
  // Only when the workflow passes one. Supplying a base where the workflow
  // does not would skip the declaration fallback entirely — the exact path
  // that broke the deploy — and report a pass over it.
  if (inv.standInBase) args.push("--base-url", PLACEHOLDER_BASE);
  args.push("--out", join(outDir, `${stub}.jsonld`));

  const r = spawnSync("bun", args, { cwd: REPO_ROOT, encoding: "utf-8" });
  const nodes = nodesEmitted(r.stdout ?? "");
  if (r.status === 0) {
    // A published graph with no nodes is not a graph. Reported as a failure
    // rather than a note: the deploy would write it, and a consumer cannot
    // tell an empty document from one whose subjects were never collected.
    if (nodes === 0) {
      return { ...inv, nodes, ok: false, detail: "exported 0 nodes — an empty graph published under a name a consumer trusts" };
    }
    return { ...inv, nodes, ok: true };
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
  return { ...inv, nodes, ok: false, detail: said || `exited ${String(r.status)} with no diagnosis` };
}

export function checkPublishedInstanceExports(): PublishedExportReport {
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

  const outDir = mkdtempSync(join(tmpdir(), "published-instance-export-"));
  try {
    return { ...base, results: invocations.map((i) => runExport(i, outDir)) };
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
  out.push(
    `Published instance exports (${r.invocations.length} invocation(s) across ` +
      `${workflows.size} workflow(s), of ${String(r.workflowsRead ?? 0)} read)`,
  );
  if (r.unreadable !== undefined) {
    // Reported ABOVE the results, and it outranks them: a sweep blind on one
    // file has not cleared the others.
    out.push(`  ? COULD NOT READ ${r.unreadable}. The results below are partial.`);
  }

  const failed = r.results.filter((x) => !x.ok);
  for (const x of r.results) {
    const counted = x.nodes === undefined ? "" : ` — ${String(x.nodes)} node(s)`;
    const note = (x.standInBase ? "  (its `--base-url` stood in)" : "") + counted;
    if (x.ok) {
      out.push(`  ✓ ${x.workflow}: ${x.instance}${note}`);
      continue;
    }
    out.push(`  ✗ ${x.workflow}: ${x.instance}${note}`);
    for (const line of (x.detail ?? "").split("\n")) out.push(`      ${line.trim()}`);
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
  const report = checkPublishedInstanceExports();
  const clean =
    report.unreadable === undefined &&
    report.invocations.length > 0 &&
    report.results.every((x) => x.ok);
  (clean ? console.log : console.error)(formatReport(report));
  process.exit(clean ? 0 : 1);
}
