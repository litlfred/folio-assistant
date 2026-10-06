/**
 * `content-holds-code` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/content-holds-code.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each judges the content instances
 * of this checkout, who-iris among them, which only the checkout holds.
 * Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. The rest
 * of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, expect, test } from "bun:test";
import { join, resolve } from "node:path";

import { contentCodeFindings, contentInstanceCode } from "../cat-harness/scripts/content-holds-code.ts";
import { KG_CRITERIA_BY_ID } from "../cat-harness/schemas/kg-qa.ts";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const REPO = resolve(ORIGIN_DIR, "..", "..", "..");

describe("contentInstanceCode — this checkout", () => {
  // Owner ruling 2026-10-01: a QA WARNING, not a failure — but one that still
  // NAMES every file. Bean `eayu`.
  test("who-iris is a QA warning, naming its five IRIS-specific code files", () => {
    expect(KG_CRITERIA_BY_ID["content-instance-holds-code"]?.severity).toBe("minor");
    const v = contentInstanceCode(join(REPO, "who-iris"));
    expect(v.state).toBe("judged");
    if (v.state !== "judged") return;
    expect(v.files).toEqual([
      "scripts/gen-iris-pages.ts",
      "scripts/tests/catalogue-links.test.ts",
      "scripts/tests/gen-iris-pages.test.ts",
      "themes/themes.test.ts",
      "themes/themes.ts",
    ]);
    expect(contentCodeFindings(v).map((f) => f.where)).toEqual(v.files);
    // The generic code left: none of the moved files may reappear here.
    expect(v.files.some((f) => /check-catalogue|gen-covers|lib\/bytes|lib\/local-path/.test(f))).toBe(false);
  });

  test("bootstrap — the content half of a real pair — passes", () => {
    const v = contentInstanceCode(join(REPO, "bootstrap"));
    expect(v).toMatchObject({ state: "judged", files: [] });
  });

  test("a platform instance that has not said is n/a", () => {
    expect(contentInstanceCode(join(REPO, "cat-harness")).state).toBe("n/a");
  });
});
