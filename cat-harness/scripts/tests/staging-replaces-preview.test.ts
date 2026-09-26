/**
 * A staging deploy REPLACES its own preview. Bean `85im`.
 *
 * `feature-staging.yml` overlaid: `mkdir -p` then `cp -R`, which adds and
 * overwrites and never deletes. That was `keep_files: true` preserved exactly
 * after the job took over the push — and it protected every OTHER branch's
 * preview (the `plj1` protection) while also preserving THIS slug's files that
 * the build no longer produced.
 *
 * Measured 2026-09-19: main relocated four proposals out of the rendered site
 * to `fsh-guts/`, the main-site deploy honoured it, and the staging preview
 * served five `proposals/*.html` pages the build had stopped producing.
 * Provably stale rather than rebuilt — the deploy was gh-pages `c190bc19c`
 * (13:18:11) while the last commit touching those files was `aca09df0e`
 * (12:34:09), the PREVIOUS deploy.
 *
 * ## Why a test rather than a comment
 *
 * A stale preview is red nowhere: the deploy is green, the bot comments the
 * URL, the check run passes, and the content is wrong. That is the `xom7`
 * shape landing on the REVIEW SURFACE rather than in CI — a reviewer opens a
 * preview to answer *"did my change take effect?"* and an overlay can only
 * ever answer that for additions. Re-adding an overlay would be free and
 * invisible; it is neither now.
 *
 * ## What is pinned
 *
 * The property, not the wording: the deploy step must **remove its own slug
 * directory before copying**, must name **exactly one slug** when it does, and
 * must **re-check the slug by value** first. An implementation that replaces
 * some other way passes; one that overlays does not, however it is spelled.
 *
 * @module cat-harness/scripts/tests/staging-replaces-preview.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.js";

const ROOT = repoRootFor(resolve(import.meta.dir, "..", ".."));
const WF = readFileSync(resolve(ROOT, ".github/workflows/feature-staging.yml"), "utf-8");

/** The deploy step's script — the one that copies the build into the preview. */
function deployScript(): string {
  const i = WF.indexOf("Deploy the preview and log the render");
  expect(i).toBeGreaterThan(-1); // the step still exists under a name we know
  const j = WF.indexOf("\n      - name:", i + 1);
  return WF.slice(i, j === -1 ? WF.length : j);
}

describe("...and refuses to replace it with nothing — bean `oisv`", () => {
  // The risk `85im` INTRODUCES, approved by the owner in the same breath as
  // the `rm`. Once the deploy deletes first, a build that failed while still
  // exiting 0 replaces a working preview with an empty one — and an empty
  // preview 404s exactly like a page the author meant to delete, so the
  // reviewer concludes their change took effect. "Could not determine" wearing
  // the costume of a determined answer.
  const step = deployScript();

  test("an empty build fails the job rather than deploying", () => {
    expect(step).toMatch(/if \[ -z "\$\(ls -A _site[^)]*\)" \]; then/);
    expect(step).toMatch(/::error::the build produced an empty \.\/_site/);
  });

  test("the guard runs BEFORE the rm — order is the whole safety argument", () => {
    // A check AFTER the delete protects nothing; it only reports the damage.
    // This asserts the ORDER, not the presence, because a guard moved below
    // the `rm` would still satisfy a presence test while protecting no one.
    const guardAt = step.indexOf('if [ -z "$(ls -A _site');
    const rmAt = step.indexOf('rm -rf "pages/STAGING/$STAGING_SLUG"');
    expect(guardAt).toBeGreaterThan(-1);
    expect(rmAt).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(rmAt);
  });

  test("the refusal exits non-zero, so a lost preview is not silent", () => {
    const guardAt = step.indexOf('if [ -z "$(ls -A _site');
    const rmAt = step.indexOf('rm -rf "pages/STAGING/$STAGING_SLUG"');
    // `exit 1` must fall inside the guard, not somewhere later in the script.
    expect(step.slice(guardAt, rmAt)).toMatch(/exit 1/);
  });

  test("the error names the slug, so the reader knows WHICH preview was spared", () => {
    expect(step).toMatch(/STAGING\/\$STAGING_SLUG keeps its last working preview/);
  });

  test("it is a floor, not a page-count threshold", () => {
    // A threshold would need calibration this has no basis for — the same
    // argument that stopped `6xaz` inventing one. `-z` on `ls -A` is the only
    // question that can be answered without a number.
    expect(step).not.toMatch(/find \.\/_site.*-name.*\|\s*wc -l/);
    expect(step).not.toMatch(/-lt \d+/);
  });
});

describe("a deploy replaces its own preview, and only its own", () => {
  const step = deployScript();

  test("it removes the slug directory before copying into it", () => {
    // The whole defect: without this, a file the build stopped producing is
    // served until something else deletes it, and nothing else does.
    const rmAt = step.indexOf('rm -rf "pages/STAGING/$STAGING_SLUG"');
    const cpAt = step.indexOf('cp -R _site/. "pages/STAGING/$STAGING_SLUG/"');
    expect(rmAt).toBeGreaterThan(-1);
    expect(cpAt).toBeGreaterThan(-1);
    expect(rmAt).toBeLessThan(cpAt);
  });

  test("the removal names ONE slug — never the STAGING root", () => {
    // `rm -rf pages/STAGING/` would be every open PR's preview, which is
    // `plj1` exactly. Asserting the shape rather than trusting the variable.
    for (const m of step.matchAll(/rm -rf\s+"?([^"\n]+)"?/g)) {
      expect(m[1]!.trim()).toBe("pages/STAGING/$STAGING_SLUG");
    }
  });

  test("the slug is re-checked BY VALUE in this step", () => {
    // It was validated in the `slug` step, but it crosses a job boundary as an
    // output. This file's own rule (bean `fuzm`): checked by value, never
    // trusted because of where it came from. An empty slug turns the removal
    // into the STAGING root.
    expect(step).toContain('case "$STAGING_SLUG" in');
    expect(step).toMatch(/""\|\.\|\.\.\|\*\/\*/);
    expect(step).toContain("exit 1");
  });

  test("no sibling slug is touched", () => {
    // Every path the step WRITES or REMOVES is under this slug. The `plj1`
    // protection is that the deploy has no reason to reach outside it.
    //
    // Comment lines are stripped first. The first version of this test did not
    // strip them and failed on its own prose — the warning above the `rm`
    // spells `pages/STAGING/` while explaining why that spelling must never be
    // reached. A comment describing the hazard is not the hazard, which is the
    // distinction `folio-root-is-asked` and `workflow-paths-resolve` both draw.
    const code = step
      .split("\n")
      .filter((l) => !/^\s*#/.test(l))
      .join("\n");
    const paths = [...code.matchAll(/pages\/STAGING\/[^\s"']*/g)].map((m) => m[0]);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) expect(p.startsWith("pages/STAGING/$STAGING_SLUG")).toBe(true);
  });

  test("both ends of the tradeoff point at each other", () => {
    // docs-site.yml states one end (a full replace deleting previews, `plj1`)
    // and feature-staging the other (an overlay that cannot show a removal,
    // `85im`). A reader meeting one must be sent to the other, or the next
    // person fixes one end and reintroduces the other.
    const docs = readFileSync(resolve(ROOT, ".github/workflows/docs-site.yml"), "utf-8");
    expect(docs).toContain("feature-staging.yml");
    expect(docs).toContain("85im");
    expect(WF).toContain("plj1");
    expect(WF).toContain("85im");
  });
});
