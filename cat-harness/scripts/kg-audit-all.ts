/**
 * kg-audit-all.ts — run the knowledge-graph audit for EVERY declared instance.
 *
 * ## Why a loop, and why it is not a flag on `kg-audit.ts`
 *
 * `kg:audit` audits ONE instance: `kg-audit.ts` resolves `root` once at module
 * scope and derives nine `*_DIR` constants plus its subject discovery and its
 * output path from it, and its own docblock says why that is right —
 * *"nothing needs a DIFFERENT root part-way through a run"*. So a `--all` flag
 * would have to unpick that single assignment, which is the design rather than
 * a limitation. This spawns one process per instance instead, which is also
 * what makes a crash in one instance a reported failure rather than an
 * exception that ends the sweep.
 *
 * ## The gap it closes
 *
 * Measured 2026-09-27 (bean `bjzs`): of 15 nested instances, **2** had a
 * `test/results` directory and **13** had none. `audit:coverage` therefore
 * could not tell "audited and clean" from "never audited" for thirteen
 * instances — the `dh4f` defect at instance scale, and the whole subject of
 * that bean. A printed verdict cannot close it; committed sidecars can.
 *
 * ## The instance this deliberately does NOT audit
 *
 * The instance declared at the REPOSITORY ROOT. `kg:audit --instance .` exits 1
 * before auditing anything: `kg-audit.ts` computes its repository root as
 * `resolve(root, "..")`, which for that one instance lands outside the
 * checkout, where there is no `package.json`. Bean `pgzn`, reproduced on `main`.
 *
 * It is skipped BY NAME and **counted in the summary as a gap**, never dropped
 * silently — an unaudited instance that nothing reports is the same defect this
 * script exists to close, one level up. And the obvious repair is wrong: the
 * value feeds `rootScripts`, which reads `package.json`, and
 * `siblingScopeFor`'s own docblock warns that substituting it for
 * `repoRootFor` *"would make the repository-furniture question wrong for that
 * same instance, in the other direction"*. So `pgzn` is a separate subject.
 *
 * @covers processes, scenarios, skills, tools, cat-harness — the same kinds
 * `kg-audit.ts` covers, because it runs exactly that audit; what differs is its
 * RANGE, not which kinds it judges. Declared rather than `computed`: the set is
 * fixed by the audit it spawns, so deriving it would read the same list through
 * one more indirection.
 *
 * @module scripts/kg-audit-all
 */
import { relative, resolve } from "node:path";

import { instanceRootsIn } from "../schemas/cat-harness.js";

const REPO = resolve(import.meta.dir, "..", "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const strict = args.includes("--strict");

/** One instance's outcome. `crashed` is NOT a kind of failure — it is worse. */
interface Outcome {
  id: string;
  code: number;
  /** The audit's own summary line, when it produced one. */
  summary?: string;
  /** Set when the run produced no summary at all. */
  crashed?: string;
}

const roots = instanceRootsIn(REPO);
/**
 * The root instance, excluded per `pgzn` — see the module docblock.
 *
 * Compared as a resolved path rather than by name, so a repository whose root
 * instance is called something else is still matched.
 */
const ROOT_INSTANCE = resolve(REPO);
const targets = roots.filter((r) => r !== ROOT_INSTANCE);
const skipped = roots.filter((r) => r === ROOT_INSTANCE).map((r) => relative(REPO, r) || ".");

const outcomes: Outcome[] = [];
for (const root of targets) {
  const id = relative(REPO, root);
  const argv = ["bun", "run", "cat-harness/scripts/kg-audit.ts", "--instance", `./${id}`];
  if (check) argv.push("--check");
  if (strict) argv.push("--strict");

  const p = Bun.spawn(argv, { cwd: REPO, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(p.stdout).text();
  const err = await new Response(p.stderr).text();
  const code = await p.exited;

  // The audit's own summary, quoted rather than recomputed: a second tally here
  // would be free to disagree with the sidecars it is reporting on.
  const summary = /^ {2}pass .*$/m.exec(out)?.[0]?.trim();
  const header = /Knowledge-graph audit\s+\([^)]*\)/.exec(out)?.[0];
  outcomes.push(
    header === undefined
      ? { id, code, crashed: (err.trim() || out.trim()).split("\n").slice(-3).join(" ").slice(0, 300) }
      : { id, code, summary: `${header.replace(/\s+/g, " ")} — ${summary ?? "no counts"}` },
  );
}

const crashed = outcomes.filter((o) => o.crashed !== undefined);
const failed = outcomes.filter((o) => o.crashed === undefined && o.code !== 0);

for (const o of outcomes) {
  const mark = o.crashed !== undefined ? "‼" : o.code === 0 ? "✓" : "✗";
  console.log(`  ${mark} ${o.id.padEnd(24)} ${o.crashed ?? o.summary ?? ""}`);
}

console.log(
  `\n${outcomes.length} instance(s) audited${check ? " (--check: nothing written)" : ""}` +
    ` — ${outcomes.length - crashed.length - failed.length} clean, ${failed.length} failing, ${crashed.length} produced no report.`,
);

// The skip is printed on EVERY run, clean or not. A gap mentioned only when
// something else fails is a gap nobody reads on the day it matters.
for (const s of skipped) {
  console.log(
    `  · not audited: ${s} — the instance declared at the repository root. \`kg:audit --instance .\` ` +
      `exits 1 before auditing anything (bean \`pgzn\`). This sweep covers ${outcomes.length} of ${roots.length} instances.`,
  );
}

if (crashed.length > 0) {
  console.error(
    `\n${crashed.length} instance(s) produced NO audit report. That is not a pass and not a failing ` +
      `criterion — nothing was judged, so nothing is known. Named above.`,
  );
}

process.exit(crashed.length > 0 || failed.length > 0 ? 1 : 0);
