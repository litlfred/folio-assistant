/**
 * Every gate `code-quality-gates.yml` runs, READ OFF the workflow.
 *
 * ## The defect this exists for
 *
 * 2026-09-19: a local sweep reported "27 CI gate lines green" and the PR's
 * TypeScript job failed anyway, on `gen-skill-docs.ts --check` — a gate the
 * sweep had never run. The list had been transcribed by hand from
 * `grep 'run: bun run'`, which matches a step whose `run:` is a one-liner and
 * misses every command inside a `run: |` block. Three of the workflow's 33
 * gates live in such a block, and the one that failed was one of them.
 *
 * Transcribing a list is the failure, not that particular grep. `5rfy` is the
 * mirror image — 21 registered gates that ran in no workflow — and the answer
 * there was the same: derive the set, never restate it.
 *
 * So this reads the workflow. A gate added to CI is in the sweep with no
 * second edit, and a sweep that says "all gates pass" means the gates CI
 * actually runs.
 *
 * ## Why a regex over YAML rather than a parser
 *
 * The question is "what commands does this file run", and a `run:` block is
 * shell, not structure — a YAML parse would hand back the same string to
 * scan. What matters is that the scan covers folded blocks, which the
 * hand-written grep did not, and `--list` prints what it found so a reader can
 * check the answer against the file rather than trust it.
 *
 * ```sh
 * bun run scripts/ci-gates.ts --list   # print the gates, one per line
 * bun run scripts/ci-gates.ts          # run them all, report each
 * ```
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { repoRootFor } from "../schemas/cat-harness.js";

// The REPOSITORY root: `WORKFLOW` names `.github/workflows/…`, which belongs to
// the repository rather than to the instance. Written when the two were one
// directory (bean `wggr`), so `".."` answered both questions at once.
const ROOT = repoRootFor(resolve(import.meta.dir, ".."));
export const WORKFLOW = ".github/workflows/code-quality-gates.yml";

/**
 * The gate commands the workflow runs, in file order, de-duplicated.
 *
 * Matches `bun run <script>` and `bun run <path>/<file>.ts`, keeping a
 * trailing `--check` or `-- --check` because a checker and its writer are
 * different commands and only one of them is a gate.
 *
 * The path branch was `scripts\/[\w.-]+\.ts`, with the directory written in.
 * The move (bean `wggr`) made it `cat-harness/scripts/…` and the extractor
 * silently stopped seeing three gates — silently because a gate it cannot see
 * is a gate it does not report as missing. The neighbouring test caught it
 * only because that test matches `bun run ` loosely and cross-checks the two,
 * which is the pattern worth keeping: one strict reader, one loose one, and an
 * assertion that they agree.
 *
 * Now any path, because the directory is not what makes a line a gate.
 */
export function gatesIn(yaml: string): string[] {
  const out: string[] = [];
  const re = /bun run ([\w.-]+(?:\/[\w.-]+)+\.ts(?: --check)?|[\w:.-]+(?: -- --check)?)/g;
  for (const m of yaml.matchAll(re)) out.push(m[1]);
  return [...new Set(out)];
}

export function gates(root = ROOT): string[] {
  return gatesIn(readFileSync(join(root, WORKFLOW), "utf-8"));
}

/**
 * Did this gate fail for want of a browser rather than for a defect?
 *
 * Playwright's own words, so a genuinely failing check cannot be mistaken for
 * an environmental one by matching something as loose as "browser".
 */
export function isMissingBrowser(output: string): boolean {
  return /Executable doesn't exist|playwright install|browserType\.launch/.test(output);
}

if (import.meta.main) {
  const list = gates();
  if (process.argv.includes("--list")) {
    for (const g of list) console.log(g);
    process.exit(0);
  }
  // An empty browser store by default, so a gate that needs one cannot pass
  // off a Chromium somebody staged by hand — a mistake made in this repository
  // on `render:bpmn:check`, where the gate was reported green because a
  // browser had been unpacked into the search path an hour earlier.
  //
  // `--with-browser` runs against the real store, which is what the e2e job
  // does; the gates that need one live in that job precisely because it
  // installs one.
  const withBrowser = process.argv.includes("--with-browser");
  const env = withBrowser
    ? process.env
    : { ...process.env, PLAYWRIGHT_BROWSERS_PATH: "/tmp/ci-gates-no-browsers" };

  const failed: string[] = [];
  const undetermined: string[] = [];
  for (const g of list) {
    const r = Bun.spawnSync(["sh", "-c", `bun run ${g} 2>&1`], { cwd: ROOT, env });
    const out = new TextDecoder().decode(r.stdout);
    if (r.exitCode === 0) {
      console.log(`PASS  ${g}`);
      continue;
    }
    // THREE STATES, not two. A gate that could not run is not a failure of the
    // change and it is emphatically not a pass: reporting it as either is the
    // "could not determine rendered as clean" defect this repository keeps
    // paying for, and it is why the exit code below counts it.
    const undet = !withBrowser && isMissingBrowser(out);
    (undet ? undetermined : failed).push(g);
    console.log(`${undet ? "UNDET" : "FAIL "} ${g}${undet ? "  (needs a browser — re-run with --with-browser)" : ""}`);
    if (!undet) for (const l of out.trim().split("\n").slice(-6)) console.log(`      ${l}`);
  }

  const pass = list.length - failed.length - undetermined.length;
  console.log(`\n${pass} pass, ${failed.length} fail, ${undetermined.length} undetermined — of ${list.length}`);
  if (undetermined.length) {
    console.log(`undetermined is NOT a pass: ${undetermined.join(", ")}`);
  }
  // Non-zero while anything is undetermined, so "the sweep was clean" can only
  // be said when every gate actually ran.
  process.exit(failed.length || undetermined.length ? 1 : 0);
}
