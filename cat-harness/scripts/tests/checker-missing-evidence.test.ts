/**
 * A checker that cannot read its evidence has not verified anything, and
 * must not say `pass`.
 *
 * Two in `qa-checkers-extended` did. `checkCanonicalScriptNotDeprecated`
 * returned `pass` when the script a block NAMES is not on disk — a claim
 * that the script is not deprecated, about a file nobody opened.
 * `checkComputeLpDualPresent` returned `pass` when the witness JSON was
 * missing, and again from inside its `catch`, so a **corrupt** witness
 * made the criterion assert success.
 *
 * The line these draw: a missing SUBJECT is vacuously satisfied and
 * still passes — a block that declares no script cannot have a
 * deprecated one. A missing piece of EVIDENCE is an unanswered question
 * and reads `n/a`. Both directions are pinned below, because collapsing
 * the two the other way would make every unremarkable block `n/a` and
 * hollow the sweep out from the opposite side.
 */
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  checkCanonicalScriptNotDeprecated,
  checkComputeLpDualPresent,
} from "../../content/pipeline/qa-checkers-extended";

let root: string;

/**
 * Fixtures use ABSOLUTE script/witness paths.
 *
 * `qa-checkers-extended` captures `REPO_ROOT = findContentRepoRoot()` at
 * module load, so a `process.chdir` in a test changes nothing and a
 * relative fixture path silently resolves against the real repository —
 * where it does not exist, making every case look like "missing
 * evidence" regardless of what the test set up. `resolve(root, abs)`
 * returns `abs`, so absolute paths reach the real code path.
 */
function comp(name: string): string {
  return join(root, "computations", name);
}

function tsFile(name: string, body: string): string {
  const p = join(root, "content", "p", "ch", name);
  writeFileSync(p, body);
  return p;
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "evidence-"));
  mkdirSync(join(root, "content", "p", "ch"), { recursive: true });
  mkdirSync(join(root, "computations"), { recursive: true });
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("checkCanonicalScriptNotDeprecated", () => {
  test("n/a when the declared script is not on disk", () => {
    const p = tsFile("missing.ts", 'export default theorem({ label: "thm:a", script: "'+comp("gone.py")+'" });\n');
    const r = (checkCanonicalScriptNotDeprecated(p));
    expect(r.result).toBe("n/a");
    expect(r.notes).toContain("not found");
  });

  test("pass when the block declares NO script — vacuously satisfied", () => {
    // The other direction. A block without a script cannot have a
    // deprecated one; turning this into n/a would empty the criterion.
    const p = tsFile("noscript.ts", 'export default theorem({ label: "thm:b" });\n');
    expect((checkCanonicalScriptNotDeprecated(p)).result).toBe("pass");
  });

  test("n/a when there is no manifest to read at all", () => {
    expect(checkCanonicalScriptNotDeprecated(undefined).result).toBe("n/a");
    expect(checkCanonicalScriptNotDeprecated("/nonexistent/x.ts").result).toBe("n/a");
  });

  test("still FAILS on a script that is actually deprecated", () => {
    // The criterion must keep working — the point is to stop reporting
    // success without evidence, not to stop reporting.
    writeFileSync(join(root, "computations", "old.py"), '"""DEPRECATED: superseded."""\n');
    const p = tsFile("dep.ts", 'export default theorem({ label: "thm:c", script: "'+comp("old.py")+'" });\n');
    const r = (checkCanonicalScriptNotDeprecated(p));
    expect(r.result).toBe("fail");
  });

  test("passes on a live script", () => {
    writeFileSync(join(root, "computations", "live.py"), '"""Computes a thing."""\n');
    const p = tsFile("live.ts", 'export default theorem({ label: "thm:d", script: "'+comp("live.py")+'" });\n');
    expect((checkCanonicalScriptNotDeprecated(p)).result).toBe("pass");
  });
});

describe("checkComputeLpDualPresent", () => {
  const LP_BLOCK = (witness: string) =>
    `export default theorem({\n  label: "thm:lp-shadow-price",\n  computation: { script: "computations/lp_solve.py", witness: "${witness}" },\n});\n`;

  test("n/a when the witness file is missing", () => {
    const p = tsFile("lpmissing.ts", LP_BLOCK(comp("gone.json")));
    const r = (checkComputeLpDualPresent(p));
    expect(r.result).toBe("n/a");
    expect(r.notes).toContain("not found");
  });

  test("n/a — not pass — when the witness does not parse", () => {
    // The sharpest case: a CORRUPT witness used to assert success.
    writeFileSync(join(root, "computations", "broken.json"), "{ not json at all ");
    const p = tsFile("lpbroken.ts", LP_BLOCK(comp("broken.json")));
    const r = (checkComputeLpDualPresent(p));
    expect(r.result).toBe("n/a");
    expect(r.notes).toContain("does not parse");
  });

  test("pass for a block that is not an LP computation at all", () => {
    // Subject absent, not evidence — the criterion genuinely does not
    // apply, and must not become n/a for every ordinary block.
    writeFileSync(join(root, "computations", "plain.json"), JSON.stringify({ value: 1 }));
    const p = tsFile("plain.ts",
      'export default theorem({ label: "thm:plain", computation: { script: "'+comp("plain.py")+'", witness: "'+comp("plain.json")+'" } });\n');
    expect((checkComputeLpDualPresent(p)).result).toBe("pass");
  });

  test("n/a when there is no manifest", () => {
    expect(checkComputeLpDualPresent(undefined).result).toBe("n/a");
  });
});
