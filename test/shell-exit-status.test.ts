/**
 * No tracked shell reads `$?` where it no longer holds the command's status —
 * bean `0s6w`.
 *
 * Two shapes, both silent and both reporting SUCCESS:
 *
 * - `if ! cmd; then rc=$?` — inside that branch `$?` is the status of `! cmd`,
 *   which is 0. `publish-gh-pages.sh` refused to publish and then exited 0 on
 *   exactly this, a green step that published nothing.
 * - `echo "x $(other) rc=$?"` — the substitution runs a command first, so `$?`
 *   is ITS status. A merge steward read `rc=0` for a conflicted PR this way.
 *
 * The rule: capture `$?` on the line after the command, before anything else
 * runs — `cmd || rc=$?`, or `cmd; rc=$?` — then use the variable.
 *
 * @module test/shell-exit-status.test
 *
 * Moved here from `cat-harness/scripts/tests/shell-exit-status.test.ts` to the
 * checkout's own test home `test/` (bean `7zz1`, owner ruling 2026-10-06
 * "Top-level instance"): every test in it asks git for every tracked shell
 * script and workflow in the checkout, `.github/` included, or pins the
 * detector that sweep runs, which only the whole checkout holds. Standing
 * alone, cat-harness has none of it, and `check:cat-harness-standalone`
 * collects every test in that layer. Paths are composed from ORIGIN_DIR, the
 * directory it was written in, so nothing it reads changed.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** The directory this test was written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move to the checkout's test home (bean `7zz1`). */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");


const REPO = resolve(ORIGIN_DIR, "..", "..", "..");

/** Tracked shell scripts and workflows: the places a `$?` is written. */
function shellSources(): string[] {
  const r = spawnSync("git", ["ls-files", "-z", "--", "*.sh", "*.bash", ".github/workflows/*.yml", ".github/workflows/*.yaml"], { cwd: REPO, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`git ls-files failed: ${r.stderr}`);
  return r.stdout.split("\0").filter(Boolean);
}

/** Every `$?` read that no longer holds the status of the command it is meant to report. */
export function staleExitStatusReads(text: string): { line: number; shape: string }[] {
  const lines = text.split("\n");
  const out: { line: number; shape: string }[] = [];
  lines.forEach((l, i) => {
    if (/^\s*#/.test(l)) return;
    // A command substitution earlier on the same line than the `$?`.
    const at = l.indexOf("$?");
    if (at > 0 && /\$\(/.test(l.slice(0, at))) out.push({ line: i + 1, shape: "$? after a command substitution" });
    // `if ! …; then` followed, inside its branch, by `$?` before any other command line.
    if (/^\s*if\s+!\s/.test(l) && /;\s*then\s*$/.test(l)) {
      for (let j = i + 1; j < lines.length; j++) {
        const t = lines[j]!.trim();
        if (t === "" || t.startsWith("#")) continue;
        if (t.includes("$?")) out.push({ line: j + 1, shape: "$? inside `if ! cmd; then`" });
        break;
      }
    }
  });
  return out;
}

describe("the detector", () => {
  test("finds both shapes", () => {
    expect(staleExitStatusReads('if ! f; then\n  rc=$?\nfi').map((x) => x.shape)).toEqual(["$? inside `if ! cmd; then`"]);
    expect(staleExitStatusReads('echo "m($(git rev-parse HEAD)) rc=$?"').map((x) => x.shape)).toEqual(["$? after a command substitution"]);
  });
  test("passes the right forms", () => {
    expect(staleExitStatusReads('rc=0\nf || rc=$?\nif [ "$rc" -ne 0 ]; then exit "$rc"; fi')).toEqual([]);
    expect(staleExitStatusReads('f\nrc=$?\necho "m($(git rev-parse HEAD)) rc=$rc"')).toEqual([]);
    expect(staleExitStatusReads('# echo "$(x) rc=$?" in a comment')).toEqual([]);
  });
});

test("no tracked shell script or workflow reads a stale $?", () => {
  const found = shellSources().flatMap((f) => staleExitStatusReads(readFileSync(join(REPO, f), "utf-8")).map((x) => `${f}:${x.line} — ${x.shape}`));
  expect(found).toEqual([]);
});
