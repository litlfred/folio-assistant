/**
 * The published docs must not claim a capability this repository does not have —
 * bean `wlqd`.
 *
 * `scripts/generate-docs.ts` — since retired to `fsh-guts/scripts/`, having
 * never run — wrote, into a page it would have served on the docs site:
 *
 * > Agents can sync and update these automatically based on the sync
 * > configuration.
 *
 * Nothing syncs. Measured 2026-09-19: `shallow-clone` exists only as a value in
 * `RemoteSyncStrategySchema`; `src/tools/skill-fetch.ts` and
 * `scripts/generate-registry.ts` contain no mention of `skills/remote-packages/`;
 * and that generator is the directory's only substantive reader, for the Docker
 * requirements `schemas/skill-package.ts` documents the wrappers as providing.
 * Two packages declare **five** skills between them, none fetchable here.
 *
 * **A docs page is the one place a reader cannot check the claim against the
 * code**, which is what makes an aspiration in the present tense worse there
 * than anywhere else. `nup0` had already shown what it costs in the tree: the
 * `manifest-skill-exists` criterion accepted a remote declaration as resolution
 * on the same reading, and for two hours two checkers disagreed about whether
 * three entries should exist.
 *
 * This asserts the property, not the wording, so a rewrite that stays honest
 * passes and one that re-adds the claim does not.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { codeWithoutComments } from "../repo-files.js";

const ROOT = join(import.meta.dir, "../..");
/**
 * RETIRED, and the guard outlives it — bean `folio-assistant-3w0i`.
 *
 * `generate-docs.ts` moved to `fsh-guts/scripts/` on 2026-09-20: it had been
 * in this repository since the ROOT COMMIT and had never run once — never in
 * a package.json script, never in a workflow, its output directory never
 * committed in any commit in the history.
 *
 * This test is kept and repointed rather than retired with it, for one
 * reason: `wlqd` corrected a false present-tense claim in that generator's
 * output, and `fsh-guts` is a relocation, not a grave. Anyone who revives the
 * script revives whatever it says — so the honesty property has to survive
 * the move, or the fix silently un-fixes on the day it matters.
 */
const GEN = readFileSync(join(ROOT, "../fsh-guts/scripts/generate-docs.ts"), "utf8");

/**
 * What the generator EMITS for the Remote Packages page — the `L.push(...)`
 * arguments only, never the surrounding source.
 *
 * Scanning the source text does not work, and this test caught it on its first
 * run: the generator's own comment quotes the false sentence as the record of
 * what the page used to say, so a substring search over the section flagged the
 * fix as the defect. Exactly the failure `manifest-remote-resolution.test.ts`
 * hit grepping for `shallow-clone` — a string search cannot tell an
 * implementation from a note about one.
 */
const EMITTED = (() => {
  const i = GEN.indexOf('L.push("# Remote Packages")');
  expect(i).toBeGreaterThan(-1);
  const section = GEN.slice(i, i + 6000);
  return [...section.matchAll(/L\.push\(([\s\S]*?)\);\n/g)].map((m) => m[1]!).join("\n");
})();

describe("the generated Remote Packages page", () => {
  test("does not state that anything syncs automatically", () => {
    // Present-tense capability claims. Each of these was either in the page or
    // one rewrite away from it.
    for (const claim of [
      "can sync and update these automatically",
      "are synced automatically",
      "Agents can sync",
    ]) {
      expect(EMITTED).not.toContain(claim);
    }
  });

  test("says the skills cannot be fetched from this instance", () => {
    expect(EMITTED).toContain("not fetchable");
  });

  test("labels the sync fields as intent rather than as behaviour", () => {
    // A column headed "Strategy" beside a live Maintainer and Repo reads as
    // live. "Intended" is the whole correction.
    expect(EMITTED).toContain("Intended strategy");
    expect(EMITTED).toContain("Intended frequency");
    expect(EMITTED).not.toContain("| Strategy | Frequency |");
  });

  test("points at the bean, so a reader can find the decision", () => {
    expect(EMITTED).toContain("wlqd");
  });
});

describe("the reason the page has to say that is still true", () => {
  // If one of these stops holding — somebody implements the sync — the page
  // should change back, and this is where that argument lives rather than being
  // rediscovered. `manifest-skill-exists` would also want its allowance back;
  // `manifest-remote-resolution.test.ts` records that half.
  test("neither skill_fetch nor the registry reads skills/remote-packages/", () => {
    // CODE, not prose. This asserted on the raw file text until 2026-09-19,
    // when a documentation comment in `skill-fetch.ts` naming the directory —
    // as one of seven a naive scan would wrongly treat as a skill package —
    // turned it red while the behaviour it guards was untouched.
    //
    // That is the failure mode this file's sibling already recorded: grepping
    // "cannot tell an implementation from a comment". Narrowing to quoted
    // strings alone does not fix it either, because a markdown code span in a
    // comment is backticked and backticks quote strings in TypeScript.
    for (const f of ["src/tools/skill-fetch.ts", "scripts/generate-registry.ts"]) {
      const code = codeWithoutComments(readFileSync(join(ROOT, f), "utf8"));
      expect(code).not.toContain("remote-packages");
    }
  });

  test("`sync` is optional, so a Docker-only wrapper need not claim a strategy", () => {
    expect(readFileSync(join(ROOT, "schemas/skill-package.ts"), "utf8")).toContain(
      "sync: RemoteSyncConfigSchema.optional()",
    );
  });
});
