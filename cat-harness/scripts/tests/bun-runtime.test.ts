/**
 * The Bun-runtime guard, and the two ways it could be silently useless.
 *
 * Bean `3ozg`. This check reports on the MACHINE rather than the corpus, so its
 * interesting states cannot be reached by pointing it at this repository: in CI
 * it always matches, and in an agent container it always mismatches. Every case
 * here therefore builds the state rather than describing it, which is the only
 * way a check like this is ever shown to fire.
 *
 * @module folio-assistant/scripts/tests/bun-runtime
 */

import { describe, expect, test } from "bun:test";

import { ENGINE_PREFIX, judge, markdown } from "../check-bun-runtime.ts";

/** `n` sidecars stamped with `version`, in the on-disk `bun-X.Y.Z` spelling. */
function stamped(version: string, n: number): string[] {
  return Array.from({ length: n }, () => `${ENGINE_PREFIX}${version}`);
}

describe("the three states", () => {
  test("equal versions are a match, and nothing is due for a rewrite", () => {
    const r = judge("1.3.14", "1.3.14", stamped("1.3.14", 86));
    expect(r.verdict).toBe("match");
    expect(r.willRewrite).toBe(0);
    expect(r.sidecars).toBe(86);
  });

  test("differing versions are a mismatch, and it COUNTS what will move", () => {
    // The real corpus on 2026-09-27: 72 at 1.3.14, 14 at 1.3.11, container 1.3.11.
    const r = judge("1.3.14", "1.3.11", [...stamped("1.3.14", 72), ...stamped("1.3.11", 14)]);
    expect(r.verdict).toBe("mismatch");
    expect(r.pinned).toBe("1.3.14");
    expect(r.running).toBe("1.3.11");
    // 72, not 86: the 14 already stamped with the RUNNING engine are skipped by
    // saveQaScriptSidecar's write-skip guard. That is where the bean's "72"
    // comes from — the count not already at the local engine, not a blast radius.
    expect(r.willRewrite).toBe(72);
    expect(r.sidecars).toBe(86);
  });

  test("an unreadable pin is `cannot-tell`, NOT a match", () => {
    const r = judge(undefined, "1.3.11", stamped("1.3.11", 3));
    expect(r.verdict).toBe("cannot-tell");
    expect(r.reason).toContain(".bun-version");
  });

  test("no reported Bun version is `cannot-tell`, NOT a match", () => {
    // `process.versions.bun` is undefined under Node. Silently passing there
    // would make the guard vanish in exactly the environment it cannot vouch for.
    const r = judge("1.3.14", undefined, stamped("1.3.14", 3));
    expect(r.verdict).toBe("cannot-tell");
    expect(r.reason).toContain("did not report");
  });
});

describe("the `bun-` prefix", () => {
  test("the count is against the PREFIXED stamp, so a match reads 0 and not everything", () => {
    // THE POINT OF THIS TEST. `.bun-version` holds `1.3.14`; a sidecar holds
    // `bun-1.3.14`. Compare them bare and every sidecar looks due for a rewrite
    // in every container, a matched one included — the check would fire always
    // and therefore mean nothing. Same shape as the tagPrefix defect #1442
    // found in the pin machinery: `1.3.14` against an upstream `bun-v1.3.14`.
    expect(judge("1.3.14", "1.3.14", stamped("1.3.14", 40)).willRewrite).toBe(0);
    // And a sidecar carrying the BARE version is genuinely not what this engine
    // writes, so it does count.
    expect(judge("1.3.14", "1.3.14", ["1.3.14"]).willRewrite).toBe(1);
  });

  test("a sidecar with no engine_version at all counts as due", () => {
    expect(judge("1.3.14", "1.3.14", [undefined]).willRewrite).toBe(1);
  });
});

describe("an empty scan does not read clean", () => {
  test("zero sidecars is reported rather than rendered as nothing to do", () => {
    const r = judge("1.3.14", "1.3.11", []);
    // Still a mismatch — the versions differ whatever the corpus holds — but
    // `sidecars: 0` is what tells a reader the count means "found none", not
    // "found none due".
    expect(r.verdict).toBe("mismatch");
    expect(r.sidecars).toBe(0);
    expect(r.willRewrite).toBe(0);
  });
});

describe("the session-start section", () => {
  test("a mismatch names the count, the bean, and the remedy", () => {
    const md = markdown(judge("1.3.14", "1.3.11", stamped("1.3.14", 72)));
    expect(md).toContain("72");
    expect(md).toContain("3ozg");
    expect(md).toContain("git checkout --");
  });

  test("it warns AGAINST the grep idiom that hid this once", () => {
    // The near-miss recorded on 3ozg: the filter used to make the churn
    // tolerable is the filter that hides it at the moment of committing.
    const md = markdown(judge("1.3.14", "1.3.11", stamped("1.3.14", 72)));
    expect(md).toContain("grep -v script-sidecars");
    expect(md).toContain(":(exclude)");
  });

  test("`cannot-tell` says unknown rather than matched", () => {
    const md = markdown(judge(undefined, "1.3.11", []));
    expect(md).toContain("unknown, not as matched");
    expect(md).not.toContain("matches");
  });

  test("a match is one line and raises no alarm", () => {
    const md = markdown(judge("1.3.14", "1.3.14", stamped("1.3.14", 86)));
    expect(md).toContain("matches");
    expect(md).not.toContain("3ozg");
  });
});
