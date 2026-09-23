/**
 * The VERIFY half of `writeQaResult`, and the four states it must keep apart.
 *
 * Bean `v556`. `kg:export` had no `--check` at all, so it sat outside
 * `regen-after-merge`'s verify/write pairs and outside
 * `check:artefact-verification`'s inventory — that gate derives its list from
 * `package.json` and counts an artefact as verified only when its script is
 * invoked with `--check`, so a generator with none could not appear in the
 * list it is judged against. Its committed sidecars were free to drift, and on
 * 2026-09-22 carried three different hashes for one script with nothing
 * reporting it.
 *
 * Written against temp directories: the real sidecar is current, so a test
 * that only asserted "the repo passes" would go on passing if `checkQaResult`
 * were gutted to `return "current"`.
 *
 * @module scripts/tests/qa-result-check
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildQaResult, checkQaResult, qaResultPath, writeQaResult } from "../qa-results.ts";

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

const root = (): string => {
  const r = mkdtempSync(join(tmpdir(), "qaresult-"));
  made.push(r);
  return r;
};

const result = (entries: unknown[], now: string) =>
  buildQaResult({
    script: "scripts/x.ts",
    scriptAbsPath: join(import.meta.dir, "qa-result-check.test.ts"),
    subject: { kind: "graph", id: "x.jsonld" },
    families: { problems: { summary: "s", entries } },
    now: new Date(now),
  });

describe("checkQaResult — four states, not two", () => {
  /* A GENERATOR THAT NEVER RAN IS NOT A STALE ONE. Folding `missing` into
   * `stale` would tell a reader to re-run something, when the real answer is
   * that nothing here has ever been produced. */
  test("no committed file is `missing`", () => {
    expect(checkQaResult(root(), "x", result([], "2026-09-23T00:00:00Z"))).toBe("missing");
  });

  test("an identical result is `current`", () => {
    const r = root();
    writeQaResult(r, "x", result(["a"], "2026-09-23T00:00:00Z"));
    expect(checkQaResult(r, "x", result(["a"], "2026-09-23T00:00:00Z"))).toBe("current");
  });

  /* THE SAME KEY AS THE WRITER. `writeQaResult` holds `updated_at` out of its
   * churn guard; if the verifier compared it, every check would be stale the
   * moment the clock moved — a writer and a reader disagreeing about what
   * "unchanged" means, which is the `nytj` family. */
  test("a LATER timestamp over identical findings is still `current`", () => {
    const r = root();
    writeQaResult(r, "x", result(["a"], "2026-09-23T00:00:00Z"));
    expect(checkQaResult(r, "x", result(["a"], "2027-01-01T00:00:00Z"))).toBe("current");
  });

  test("changed findings are `stale`", () => {
    const r = root();
    writeQaResult(r, "x", result(["a"], "2026-09-23T00:00:00Z"));
    expect(checkQaResult(r, "x", result(["a", "b"], "2026-09-23T00:00:00Z"))).toBe("stale");
  });

  /* UNPARSEABLE IS ITS OWN ANSWER. Reporting it as `stale` would send somebody
   * to re-run a generator when the file on disk is not a result at all. */
  test("an unparseable file is `unreadable`, not `stale`", () => {
    const r = root();
    const p = qaResultPath(r, "x");
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, "{ not json");
    expect(checkQaResult(r, "x", result([], "2026-09-23T00:00:00Z"))).toBe("unreadable");
  });

  test("`qaResultPath` names the file the message must point at", () => {
    const r = root();
    expect(qaResultPath(r, "kg-export").endsWith("kg-export.qa-results.json")).toBe(true);
    writeQaResult(r, "kg-export", result([], "2026-09-23T00:00:00Z"));
    expect(checkQaResult(r, "kg-export", result([], "2026-09-23T00:00:00Z"))).toBe("current");
  });
});
