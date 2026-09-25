/**
 * The site root is composed from the instance stub, in ONE place.
 *
 * Bean `x4a6`. Before the move, `docs/` was spelled out separately in
 * `translation-index.ts`, `gen-docs-pages.ts`, `gen-skill-docs.ts`,
 * `gen-schema-docs.ts` and `translation-qa-sweep.ts` — five copies free to
 * disagree, and the bean counted them as the defect. Packaging the site under
 * `docs/<stub>/` for the repo split moved all five at once; nothing stopped a
 * sixth appearing the next day.
 *
 * This is the same shape as `graph-kind-docs.test.ts` (bean `5o3a`): a fact
 * that lives in code and in prose drifts unless something crosses between
 * them. Here both sides are code, which makes it cheaper, not less necessary.
 *
 * @module scripts/tests/site-dir-single-answer
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { repoRootFor, siteDir, siteDirFor } from "../../schemas/cat-harness.ts";
import { repoFilesWithExt } from "../repo-files.js";

const ROOT = resolve(import.meta.dir, "../..");

/**
 * Source trees that resolve paths at runtime. `docs/` itself is excluded: its
 * pages legitimately talk about their own layout in prose.
 *
 * `test` rather than `tests` since 2026-09-19 (bean `auap`), when the two test
 * trees were consolidated. `sourceFiles()` keeps only `.ts`/`.mjs`, so naming
 * `test/` here does not drag in the 500-odd JSON verdicts under
 * `test/results/` — but a stale `tests` WOULD have dropped `a11y.e2e.ts`, the
 * very file the `[^\n]*` widening above was written for, and the guard would
 * have kept passing.
 */
const TREES = ["scripts", "content", "schemas", "src", "test"];

/**
 * A literal naming the OUTPUT site root **in a path-resolving position**.
 *
 * Scoped to `join`/`resolve`/`readFileSync`/`existsSync`/`readdirSync` rather
 * than to every quoted `docs/…` on purpose. Plenty of strings here name the
 * path as PROSE — a finding's `where:`, a console message, a QA criterion's
 * description — and those are documentation, not resolution: they do not
 * break when the directory moves, and failing on them would mean the guard
 * fires on its own rationale. The defect this bean measured was five
 * CONSTANTS that resolve to a directory, so that is what is checked.
 *
 * `content/docs/` is the generator's INPUT — a different directory that
 * happens to share a segment — so a preceding `content` disqualifies a hit.
 *
 * ## `scanSync` and a bare `cwd:` were added after they let one through
 *
 * `html-comment-delimiters.test.ts` globbed with `scanSync` and a bare `cwd`
 * set to the site-root literal — matching none of the named functions, so this
 * guard passed it. (Spelled around rather than quoted, because writing it out
 * makes this guard fire on its own rationale; the sibling test reassembles its
 * fixture from parts for the same reason.) The stub
 * inversion then broke it in the worst available way: the move left an empty
 * `docs/` holding only the gitignored bundler tree, so LOCALLY the glob
 * matched nothing and the test passed over zero files — while in CI
 * `bundle install` populates that tree and the test reported findings in
 * third-party gem HTML. Green locally, red in CI, and neither run was looking
 * at the site.
 *
 * The lesson is about the SHAPE of the list, not the one missing entry: a
 * function allow-list only covers the resolution idioms somebody thought of.
 * A bare `cwd:`/`dir:`/`root:` property is a path-resolving position whatever
 * consumes it, so those are matched directly.
 */
const LITERAL =
  // `[^\n]*` rather than `[^)\n]*`: a nested call -- `join(dirname(x), "..",
  // "docs/…")` -- puts a `)` between the opener and the literal, and the
  // tighter pattern walked straight past exactly that line in `a11y.e2e.ts`.
  /(?:\b(?:join|resolve|readFileSync|existsSync|readdirSync|statSync|scanSync|glob|Glob)\s*\([^\n]*|\b(?:cwd|dir|root|base)\s*:\s*)(["'`])\.?\/?docs(\/[^"'`\n]*)?\1/;

/**
 * Source under the scanned trees — **including files not yet committed**.
 *
 * This used to call `git ls-files` directly, which lists tracked files only.
 * That made the guard blind to exactly the files most likely to violate it:
 * `gen-themes-css.ts` and `theme-tokens.test.ts` both hardcoded the site root,
 * a full local `bun test` reported 0 fail, and CI after the commit was the
 * earliest possible detection. Bean `bgle`.
 */
function sourceFiles(): string[] {
  return repoFilesWithExt(ROOT, TREES, [".ts", ".mjs"]);
}

/**
 * Source with its comments blanked, line numbering preserved.
 *
 * ## Why this is a function rather than two `.replace` calls
 *
 * It WAS two: `line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "")`,
 * applied per line. That handles `//` and a `/* … *` + `/` opened and closed on
 * one line, and **misses a `/** … *` + `/` block entirely** — every
 * continuation line of a JSDoc comment reached the scanner as code.
 *
 * So the guard failed on documentation that explained the guard. Measured
 * 2026-09-22: a test comment reading *"it was `join(REPO, "cat-harness",
 * "docs")`, and `site-dir-single-answer` refused it"* was reported as a
 * violation. That is precisely the case the original comment said stripping
 * existed to prevent — the intent was right and the implementation did not
 * reach it.
 *
 * Worth fixing rather than rewording the comment, because the next person to
 * document a path decision hits it too, and the obvious escape is to delete
 * the explanation instead of the literal.
 *
 * Blanking rather than deleting, so `${rel}:${i + 1}` still names the real
 * line. A dropped line would shift every number after it, and a guard that
 * reports the wrong line is worse than one that misses.
 *
 * NOT a full tokenizer: a `/*` inside a string literal blanks from there to
 * the next `*` + `/`. That direction is safe — it can only HIDE a violation,
 * never invent one — and a scanner elaborate enough to parse strings is a
 * scanner with its own bugs. The narrow miss is preferred to the broad one.
 */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (m) => " ".repeat(m.length));
}

describe("the site root is one answer, not a literal", () => {
  test("siteDir composes docs/<stub> and siteDirFor reads this instance's", () => {
    expect(siteDir({ name: "x", stub: "y" })).toBe("docs");
    // No longer varies with the stub: the instance root IS the stub directory,
    // so the site dir within it is the same string for every instance.
    expect(siteDir({ name: "x" })).toBe("docs");
    expect(siteDirFor(ROOT)).toBe("docs");
  });

  test("an instance with no name or stub cannot get a guessed site root", () => {
    // Third-state discipline: a wrong site root writes the whole site into a
    // directory nothing serves, so "could not determine" must throw rather
    // than fall back to `docs/`.
    expect(() => siteDirFor(join(ROOT, "scripts"))).toThrow(/cannot determine the site root/);
  });

  test("no source file hardcodes the output site root", () => {
    const offenders: string[] = [];
    for (const rel of sourceFiles()) {
      const text = readFileSync(join(ROOT, rel), "utf-8");
      // Comments are stripped BEFORE the per-line scan, and the reason is
      // stated on `stripComments`: the rationale for this rule necessarily
      // names the old path, and a guard that fails on its own explanation is
      // one the next person deletes.
      stripComments(text)
        .split("\n")
        .forEach((code, i) => {
          if (!LITERAL.test(code)) return;
          if (/content["'`]?\s*,\s*["'`]docs|content\/docs/.test(code)) return;
          offenders.push(`${rel}:${i + 1}: ${text.split("\n")[i]!.trim()}`);
        });
    }
    expect(offenders).toEqual([]);
  });

  /**
   * The guard above scans `.ts`/`.mjs`. `.gitignore` is neither, and it names
   * the site root **five times** — which is how the inversion broke it in both
   * directions at once, five hours after the repo last paid for exactly this.
   *
   * Measured 2026-09-19 on `daf19326c`, after `docs-site.yml` had already been
   * pointed at `./folio-assistant/docs`:
   *
   * - `!docs/assets/js/` no longer reached the moved tree, so the blanket
   *   `*.js` rule swallowed it. A NEW file under `<stub>/docs/assets/js/`
   *   would have been invisible to `git add` — the file's own comment records
   *   that happening before, verbatim: *"`git add` reported nothing and the
   *   file would simply never have deployed."*
   * - `docs/.bundle/` and `docs/vendor/` no longer reached it either, so the
   *   bundler's gem tree was unignored again. The same comment prices that at
   *   **3,080 files and 53 MB** that any `git add -A` would sweep into a
   *   commit.
   *
   * Neither was visible, and the reason is worth more than the fix: a working
   * tree that predates the move still HAS a `docs/`, holding build residue, so
   * the stale rules went on matching something. **A rule matching the wrong
   * thing reads exactly like a rule matching the right thing.**
   *
   * So this asserts the direction that actually matters — what git does to a
   * path — rather than the spelling. A rename of the stub flips these before
   * anyone can ship it, which is the point: `folio-assistant/` → `cat-harness/`
   * is the next move, and it walks straight back into this.
   */
  test("`.gitignore` follows the site root, in both directions", () => {
    // REPO-relative, composed and said so: `git check-ignore` runs at the
    // repository root, while `siteDir` is measured from the instance root.
    // This is the one caller that needs the other form.
    //
    // Composed from the instance directory's BASENAME, not from `artefactStub`.
    // Those were the same string until the move (bean `wggr`) and are now two
    // different facts: the directory is `cat-harness/`, while the stub stays
    // `folio-assistant` because it names PUBLISHED artefacts — `<stub>.jsonld`
    // is what every `@id` in the graph is minted against, so renaming it
    // renames the whole graph. Using the stub here would have made this guard
    // check `.gitignore` against a directory that does not exist, and pass.
    const site = `${basename(ROOT)}/${siteDirFor(ROOT)}`;

    // Hand-written source Jekyll serves verbatim. Ignoring these is the SILENT
    // failure: `git add` says nothing and the asset never deploys.
    const mustBeAddable = [
      `${site}/assets/js/probe.js`,
      `${site}/assets/js/vendor/probe.js`,
      `${site}/_includes/probe.js`,
    ];

    // Local build state. NOT ignoring these is the loud failure: `git add -A`
    // commits a gem tree.
    const mustBeIgnored = [
      `${site}/.bundle/config`,
      `${site}/vendor/bundle/probe.rb`,
      `${site}/_data/build.yml`,
      `${site}/_site/probe.html`,
    ];

    const ignored = (rel: string) =>
      spawnSync("git", ["check-ignore", "-q", "--no-index", "--", rel], {
        cwd: repoRootFor(ROOT),
      }).status === 0;

    expect(mustBeAddable.filter(ignored)).toEqual([]);
    expect(mustBeIgnored.filter((r) => !ignored(r))).toEqual([]);
  });
});
