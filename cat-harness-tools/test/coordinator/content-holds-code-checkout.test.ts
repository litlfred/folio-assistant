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
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { contentCodeFindings, contentInstanceCode } from "../../scripts/content-holds-code.ts";
import { KG_CRITERIA_BY_ID } from "../../schemas/sdlc/kg-qa.ts";
import { notApplicableAlone } from "../support/checkout.ts";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../../../cat-harness/scripts/tests");

const REPO = resolve(ORIGIN_DIR, "..", "..", "..");

describe("contentInstanceCode — this checkout", () => {
  // Owner ruling 2026-10-01: a QA WARNING, not a failure — but one that still
  // NAMES every file. Bean `eayu`.
  // who-iris is a content instance above the harness, held only by the composed checkout.
  const noIris = !existsSync(join(REPO, "who-iris")) && notApplicableAlone("who-iris's checkout, whose code files this names (a higher instance)");
  test.skipIf(noIris)("who-iris is a QA warning, naming its IRIS-specific code files", () => {
    expect(KG_CRITERIA_BY_ID["content-instance-holds-code"]?.severity).toBe("minor");
    const v = contentInstanceCode(join(REPO, "who-iris"));
    expect(v.state).toBe("judged");
    if (v.state !== "judged") return;
    expect(v.files).toEqual([
      // The platform shim (issue #2228): the one file that names where the
      // platform lives, so the climbs out of who-iris are in one place.
      "platform.ts",
      "scripts/build-iris-oxigraph.ts",
      "scripts/gen-iris-pages.ts",
      // The IRIS CDN exporter (who-iris#103) and the cover fetch and
      // preview renderer, all IRIS-specific, and the exporter's test.
      "scripts/iris-cdn/bag.ts",
      "scripts/iris-cdn/rest-feed.ts",
      "scripts/iris-cdn/run.ts",
      "scripts/iris-cdn/signing.ts",
      "scripts/iris-covers/fetch-referenced-pdfs.py",
      "scripts/iris-covers/render-previews.py",
      "scripts/iris-oxigraph-search.ts",
      "scripts/tests/catalogue-links.test.ts",
      "scripts/tests/gen-iris-pages.test.ts",
      "scripts/tests/iris-cdn.test.ts",
      "scripts/tests/iris-oxigraph.test.ts",
      // The untainted round-trip translation report over who-iris's own
      // catalogues (bean `folio-assistant-ktt2`), and its test.
      "scripts/tests/translation-roundtrip-report.test.ts",
      "scripts/translation-roundtrip-report.ts",
      "themes/themes.test.ts",
      "themes/themes.ts",
      // Its Tool node (2026-10-09): the `iris-pages` generator its catalogue
      // visualiser is `renderedBy`. A declaration, but a `.ts` one, as every
      // instance's `tools` graph is.
      "tools/index.ts",
      // That Tool's own folder (bean `tdir`, tools/<id>/<id>.ts).
      "tools/iris-pages/iris-pages.ts",
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
