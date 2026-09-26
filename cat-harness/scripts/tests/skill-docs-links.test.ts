/**
 * `hloc` box 3 — what `gen-skill-docs` leaves behind must be the PUBLISHED
 * tree, not a link that happens to be unresolvable.
 *
 * The generator flattens a skill package: a body authored at
 * `cat-harness/skills/<pkg>/x.md` is published at
 * `cat-harness/docs/reference/skill-instructions/x.md`. Both are three
 * directories deep, so a `../../../` link is correct at the source and lands
 * one level short in the output — `<repo>/beans/defs/` becomes
 * `cat-harness/beans/defs/`, which does not exist.
 *
 * `rebaseLinks` exists to fix exactly that, and its matcher required a FILE
 * EXTENSION:
 *
 * ```text
 * /\]\((\.{0,2}[^)\s:]*?\.[A-Za-z0-9]+)(#[^)\s]*)?\)/g
 * ```
 *
 * A directory target has none, so `](../../../beans/defs/)` never reached
 * `publishedLocation` and was published broken. I widened that pattern from
 * `\.md` to `\.[A-Za-z0-9]+` in #1398 — more extensions, still no directories,
 * and the case I added it for hid the case I did not.
 *
 * This asserts the OUTCOME rather than the pattern: a relative link on a
 * generated page resolves inside the site, or it is one of the documented
 * leave-alones. A regex test would pass again the next time the matcher is
 * widened in a way that misses a shape.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { siteDirFor } from "../../schemas/cat-harness.ts";

const HARNESS = resolve(import.meta.dir, "../..");
const GENERATED = join(HARNESS, siteDirFor(HARNESS), "reference", "skill-instructions");

/** Every inline markdown link target on a page, anchors and titles stripped. */
function linkTargets(body: string): string[] {
  const out: string[] = [];
  for (const m of body.matchAll(/\]\(([^)\s]+)/g)) out.push(m[1].replace(/#.*$/, ""));
  return out;
}

/**
 * A link whose destination does not depend on where the page sits — an
 * absolute URL, a site-absolute path, or a bare fragment. None of these is
 * the generator's to rebase.
 */
function relativeTarget(t: string): boolean {
  if (t === "" || t.startsWith("/") || t.startsWith("#")) return false;
  return !/^[a-z][a-z0-9+.-]*:/i.test(t);
}

describe("generated skill instruction pages", () => {
  const pages = existsSync(GENERATED)
    ? readdirSync(GENERATED).filter((f) => f.endsWith(".md"))
    : [];

  const resolvesFrom = (dir: string, t: string): boolean => {
    const dest = resolve(dir, t);
    const candidates = [dest, `${dest}.md`, join(dest, "index.md")];
    if (dest.endsWith(".html")) candidates.push(`${dest.slice(0, -".html".length)}.md`);
    return candidates.some(existsSync);
  };

  test("the generated directory exists and has pages", () => {
    // Without this the assertion below passes over an empty set, which is the
    // vacuity every check in this repo is required to rule out.
    expect(pages.length).toBeGreaterThan(10);
  });

  test("a link that is correct AT ITS SOURCE resolves from the generated page too", () => {
    // The control, and it is `ahab`'s applied to a generator rather than to a
    // translator. A published page sits one directory DEEPER than the body it
    // was generated from — `cat-harness/skills/<pkg>/x.md` is three from the
    // repository root, `cat-harness/docs/reference/skill-instructions/x.md` is
    // four — so `../../../beans/defs/` is right at the source and lands at
    // `cat-harness/beans/defs/` here. `rebaseLinks` exists to close that
    // gap and its matcher required a file extension, so a DIRECTORY target
    // never reached it.
    //
    // Broken at BOTH depths is not this test's business and must not be:
    // `hloc` box 2 says a target the generator cannot place is left exactly as
    // written, because a plausible-looking rewrite turns a broken link into an
    // undetectable one. `.claude/skills/local/todo-manager.md` links
    // `../../../skills/folio-core/todo-manager.md`, which resolves nowhere
    // from its own source either — so it is a SOURCE defect, correctly
    // published untouched, and an earlier draft of this test wrongly called it
    // a generator failure.
    const unrebased: string[] = [];
    for (const page of pages) {
      const abs = join(GENERATED, page);
      const own = dirname(abs);
      const atSource = dirname(own); // one level up — the source page's depth
      for (const t of linkTargets(readFileSync(abs, "utf-8"))) {
        if (!relativeTarget(t)) continue;
        if (resolvesFrom(own, t)) continue;
        if (resolvesFrom(atSource, t)) unrebased.push(`${page}: ${t}`);
      }
    }
    expect(unrebased).toEqual([]);
  });
});
